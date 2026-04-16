const fs = require('fs');
const path = require('path');

const ENTRIES_DIR = path.join(__dirname, '../darketype/entries');
const HASHNODE_DIR = path.join(__dirname, '../.hashnode');

// States we automatically consider publishable
const PUBLISHABLE_STATES = ['shipped', 'expanded', 'learning'];

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

function capitalizeMarkdown(text) {
    let inCodeBlock = false;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            continue;
        }
        if (inCodeBlock) continue;

        // Skip HTML/React components entirely
        if (line.trim().startsWith('<')) continue;

        // Skip lines that just start with a URL
        if (line.trim().match(/^https?:\/\//)) continue;

        // Capitalize string start, ignoring non-alphabet prefixes like !, [, (, >, *, -, _, #, spaces, etc.
        line = line.replace(/^([^a-zA-Z]*)([a-z])/, (m, p1, p2) => p1 + p2.toUpperCase());

        // Capitalize after sentence punctuation (. ! ?)
        line = line.replace(/([.!?]\s+[^a-zA-Z]*)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

        lines[i] = line;
    }
    return lines.join('\n');
}

function resolveMediaPaths(body) {
    // Replace relative media paths to absolute GitHub pages paths
    return body.replace(/\.\.\/entries\/media\//g, 'https://bmccall17.github.io/darketype/entries/media/');
}

function build() {
    console.log('🚧 exporting to Hashnode...');

    if (!fs.existsSync(HASHNODE_DIR)) {
        fs.mkdirSync(HASHNODE_DIR);
    }

    const files = fs.readdirSync(ENTRIES_DIR).filter(f => f.endsWith('.md') && f !== 'TEMPLATE.md');

    let exportedCount = 0;

    for (const file of files) {
        const filePath = path.join(ENTRIES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { meta, body } = parseFrontmatter(content);

        const slug = file.replace(/\.md$/, '');
        
        // Determine if publishable
        // Can be forced via hashnode: true/false in frontmatter
        let shouldPublish = false;
        if (meta.hashnode === 'false') {
            shouldPublish = false;
        } else if (meta.hashnode === 'true') {
            shouldPublish = true;
        } else {
            shouldPublish = PUBLISHABLE_STATES.includes(meta.state || '');
        }

        if (!shouldPublish) continue;

        // Format body
        let newBody = capitalizeMarkdown(body);
        newBody = resolveMediaPaths(newBody);

        let title = meta.title || file;
        // Also ensure title is capitalized
        title = title.charAt(0).toUpperCase() + title.slice(1);

        // Build Hashnode Frontmatter
        let tags = "";
        if (meta.tags) {
            let t = meta.tags.replace(/[\[\]]/g, '');
            t = t.replace(/['"]/g, '');
            tags = t;
        }

        const hashnodeFrontmatter = [
            '---',
            `title: "${title}"`,
            `slug: ${slug}`,
            `domain: darketype.hashnode.dev`,
            `canonical: "https://bmccall17.github.io/darketype/weblog/${slug}.html"`,
            `cover: "https://bmccall17.github.io/assets/social/og/${slug}.png"`,
        ];

        if (tags) hashnodeFrontmatter.push(`tags: ${tags}`);
        if (meta.series) hashnodeFrontmatter.push(`seriesSlug: ${meta.series}`);
        
        hashnodeFrontmatter.push('---', '');

        const finalContent = hashnodeFrontmatter.join('\n') + '\n' + newBody;

        fs.writeFileSync(path.join(HASHNODE_DIR, file), finalContent);
        exportedCount++;
    }

    console.log(`✅ successfully exported ${exportedCount} entries to .hashnode/`);
}

build();
