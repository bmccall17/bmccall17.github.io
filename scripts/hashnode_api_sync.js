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
const HASHNODE_HOST = 'darketype.hashnode.dev';

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

// ─── Fetch existing posts from publication ───────────────────────────────────
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
    
    const variables = { host: HASHNODE_HOST };
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

// ─── Fetch existing series from publication ──────────────────────────────────
async function fetchSeries() {
    const query = `
        query GetSeries($host: String!) {
            publication(host: $host) {
                seriesList(first: 20) {
                    edges {
                        node {
                            id
                            slug
                            name
                        }
                    }
                }
            }
        }
    `;

    const variables = { host: HASHNODE_HOST };
    try {
        const data = await graphqlRequest(query, variables);
        const series = data.publication?.seriesList?.edges || [];
        const map = {};
        series.forEach(s => {
            map[s.node.slug] = s.node.id;
        });
        return map;
    } catch (err) {
        console.error('Error fetching series:', err);
        return {};
    }
}

// ─── Build tags array from comma-separated string ────────────────────────────
function buildTags(tagsString) {
    if (!tagsString) return [];
    return tagsString.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => ({
            slug: t.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
            name: t
        }));
}

// ─── Publish a new post ──────────────────────────────────────────────────────
async function publishPost(meta, body, slug, seriesMap) {
    const query = `
        mutation PublishPost($input: PublishPostInput!) {
            publishPost(input: $input) {
                post { id url }
            }
        }
    `;

    const input = {
        title: meta.title || "Untitled",
        contentMarkdown: body,
        publicationId: HASHNODE_PUB_ID,
        slug: slug,
        originalArticleURL: meta.canonical || undefined,
        coverImageOptions: {
            coverImageURL: meta.cover || `https://bmccall17.github.io/assets/social/og/${slug}.png`
        },
        tags: buildTags(meta.tags)
    };

    // Attach series if available
    if (meta.seriesSlug && seriesMap[meta.seriesSlug]) {
        input.seriesId = seriesMap[meta.seriesSlug];
    } else if (meta.seriesSlug) {
        console.warn(`  ⚠  series "${meta.seriesSlug}" not found on Hashnode — create it in the Dashboard first`);
    }

    const data = await graphqlRequest(query, { input });
    return data.publishPost.post.url;
}

// ─── Update an existing post ─────────────────────────────────────────────────
async function updatePost(postId, meta, body, slug, seriesMap) {
    const query = `
        mutation UpdatePost($input: UpdatePostInput!) {
            updatePost(input: $input) {
                post { id url }
            }
        }
    `;

    const input = {
        id: postId,
        title: meta.title || "Untitled",
        contentMarkdown: body,
        originalArticleURL: meta.canonical || undefined,
        coverImageOptions: {
            coverImageURL: meta.cover || `https://bmccall17.github.io/assets/social/og/${slug}.png`
        },
        tags: buildTags(meta.tags)
    };

    // Attach series if available
    if (meta.seriesSlug && seriesMap[meta.seriesSlug]) {
        input.seriesId = seriesMap[meta.seriesSlug];
    } else if (meta.seriesSlug) {
        console.warn(`  ⚠  series "${meta.seriesSlug}" not found on Hashnode — create it in the Dashboard first`);
    }

    const data = await graphqlRequest(query, { input });
    return data.updatePost.post.url;
}

// ─── Main sync loop ──────────────────────────────────────────────────────────
async function sync() {
    console.log('🔄 Fetching existing Hashnode posts...');
    const remotePosts = await fetchRemotePosts();
    console.log(`Found ${Object.keys(remotePosts).length} existing posts.`);

    console.log('🔄 Fetching existing Hashnode series...');
    const seriesMap = await fetchSeries();
    console.log(`Found ${Object.keys(seriesMap).length} existing series.`);
    if (Object.keys(seriesMap).length > 0) {
        Object.entries(seriesMap).forEach(([slug, id]) => console.log(`  → ${slug} (${id})`));
    }

    const files = fs.readdirSync(HASHNODE_DIR).filter(f => f.endsWith('.md'));

    let published = 0, updated = 0, failed = 0;

    for (const file of files) {
        const content = fs.readFileSync(path.join(HASHNODE_DIR, file), 'utf-8');
        const { meta, body } = parseFrontmatter(content);
        const localSlug = file.replace(/\.md$/, '');
        const safeSlug = localSlug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

        try {
            if (remotePosts[safeSlug]) {
                console.log(`⟳ Updating: ${safeSlug}`);
                const url = await updatePost(remotePosts[safeSlug], meta, body, safeSlug, seriesMap);
                console.log(`  ✓ ${url}`);
                updated++;
            } else {
                console.log(`✦ Publishing NEW: ${safeSlug}`);
                const url = await publishPost(meta, body, safeSlug, seriesMap);
                console.log(`  ✓ ${url}`);
                published++;
            }
        } catch (err) {
            console.error(`❌ Failed to sync ${safeSlug}:`, JSON.stringify(err, null, 2));
            failed++;
        }
    }
    console.log(`\n✅ Sync complete: ${published} published, ${updated} updated, ${failed} failed.`);
}

sync();
