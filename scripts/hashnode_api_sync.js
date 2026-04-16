const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) process.env[match[1]] = match[2].trim().replace(/['"]/g, '');
    });
}

const HASHNODE_PAT = process.env.HASHNODE_PAT;
const HASHNODE_PUB_ID = process.env.HASHNODE_PUB_ID;

if (!HASHNODE_PAT || !HASHNODE_PUB_ID) {
    console.error('❌ Missing HASHNODE_PAT or HASHNODE_PUB_ID in .env file.');
    console.log('To get your PAT: https://hashnode.com/settings/developer');
    console.log('To get your Pub ID: Go to your Blog Dashboard, it\'s the long ID in the URL!');
    process.exit(1);
}

const HASHNODE_DIR = path.join(__dirname, '../.hashnode');

function parseFrontmatter(content) {
    const match = content.match(/^---([\s\S]*?)---/);
    if (!match) return { meta: {}, body: content };
    const frontmatter = match[1];
    const meta = {};
    frontmatter.split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > -1) {
            const key = line.substring(0, idx).trim();
            const val = line.substring(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
            meta[key] = val;
        }
    });
    return { meta, body: content.slice(match[0].length).trim() };
}

function graphqlRequest(query, variables) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({ query, variables });

        const options = {
            hostname: 'gql.hashnode.com',
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': HASHNODE_PAT,
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.errors) reject(json.errors);
                    else resolve(json.data);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function fetchRemotePosts() {
    const query = `
        query GetPosts($host: String!) {
            publication(host: $host) {
                posts(first: 50) {
                    edges {
                        node {
                            id
                            slug
                            title
                        }
                    }
                }
            }
        }
    `;
    
    // We use the connected domain or the internal domain. Let's use the known host.
    const variables = { host: "darketype.hashnode.dev" };
    try {
        const data = await graphqlRequest(query, variables);
        const posts = data.publication?.posts?.edges || [];
        const map = {};
        posts.forEach(p => {
            map[p.node.slug] = p.node.id;
        });
        return map;
    } catch (err) {
        console.error('Error fetching remote posts:', err);
        return {};
    }
}

async function publishPost(meta, body, slug) {
    const query = `
        mutation PublishPost($input: PublishPostInput!) {
            publishPost(input: $input) {
                post { id url }
            }
        }
    `;
    const variables = {
        input: {
            title: meta.title || "Untitled",
            contentMarkdown: body,
            publicationId: HASHNODE_PUB_ID,
            slug: slug,
            originalArticleURL: meta.canonical || undefined
        }
    };

    // Note: coverImageOptions seems to require an image ID uploaded to Hashnode first,
    // so we omit cover image from the basic API publish to ensure it succeeds.

    const data = await graphqlRequest(query, variables);
    return data.publishPost.post.url;
}

async function updatePost(postId, meta, body, slug) {
    const query = `
        mutation UpdatePost($input: UpdatePostInput!) {
            updatePost(input: $input) {
                post { id url }
            }
        }
    `;
    const variables = {
        input: {
            id: postId,
            title: meta.title || "Untitled",
            contentMarkdown: body,
            originalArticleURL: meta.canonical || undefined
        }
    };

    const data = await graphqlRequest(query, variables);
    return data.updatePost.post.url;
}

async function sync() {
    console.log('🔄 Fetching existing Hashnode posts...');
    const remotePosts = await fetchRemotePosts();
    console.log(`Found ${Object.keys(remotePosts).length} existing posts.`);

    const files = fs.readdirSync(HASHNODE_DIR).filter(f => f.endsWith('.md'));

    for (const file of files) {
        const content = fs.readFileSync(path.join(HASHNODE_DIR, file), 'utf-8');
        const { meta, body } = parseFrontmatter(content);
        const slug = file.replace(/\.md$/, '');

        try {
            if (remotePosts[slug]) {
                console.log(`Updating existing post: ${slug}`);
                await updatePost(remotePosts[slug], meta, body, slug);
            } else {
                console.log(`Publishing NEW post: ${slug}`);
                await publishPost(meta, body, slug);
            }
        } catch (err) {
            console.error(`❌ Failed to sync ${slug}:`, JSON.stringify(err, null, 2));
        }
    }
    console.log('✅ Sync complete.');
}

sync();
