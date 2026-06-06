const fs = require('fs');
const path = require('path');

const ENTRIES_DIR = path.join(__dirname, '../darketype/entries');
const HASHNODE_DIR = path.join(__dirname, '../.hashnode');

// States we automatically consider publishable
const PUBLISHABLE_STATES = ['shipped', 'expanded', 'learning', 'mess', 'frustrated', 'optimistic', 'seed', 'debugging', 'broken'];

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

function extractSeoDescription(body) {
    // Strip frontmatter, code blocks, images, links, headings, bold/italic — get first clean paragraph
    let text = body.replace(/```[\s\S]*?```/g, '').trim();
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
    text = text.replace(/\[[^\]]*\]\([^)]*\)/g, (m) => m.replace(/\[([^\]]*)\]\([^)]*\)/, '$1'));
    text = text.replace(/^#{1,6}\s+.*/gm, '');
    text = text.replace(/[*_`~]+/g, '');
    text = text.replace(/\n+/g, ' ').trim();
    return text.slice(0, 150).trim();
}

function build() {
    console.log('🚧 exporting to Hashnode...');

    if (!fs.existsSync(HASHNODE_DIR)) {
        fs.mkdirSync(HASHNODE_DIR);
    }

    const files = fs.readdirSync(ENTRIES_DIR).filter(f => f.endsWith('.md') && f !== 'TEMPLATE.md');

    let exportedCount = 0;
    const manifest = {};       // slug → hashnode URL mapping
    const seriesAudit = {};    // series slug → array of entry slugs

    for (const file of files) {
        const filePath = path.join(ENTRIES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { meta, body } = parseFrontmatter(content);

        const slug = file.replace(/\.md$/, '');
        const safeSlug = slug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        
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

        // Track series membership
        if (meta.series) {
            const seriesKey = meta.series.trim();
            if (!seriesAudit[seriesKey]) seriesAudit[seriesKey] = [];
            seriesAudit[seriesKey].push({ slug: safeSlug, title: meta.title || file });
        }

        // Format body
        let newBody = capitalizeMarkdown(body);
        newBody = resolveMediaPaths(newBody);

        // Add linkback to original post
        const originalUrl = `https://bmccall17.github.io/darketype/weblog/${slug}.html`;
        newBody += `\n\n---\n\n*View this post with the full interactive/glitchy experience on [darketype](${originalUrl}).*`;

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

        const ogImageUrl = `https://bmccall17.github.io/assets/social/og/${slug}.png`;
        const seoTitle = title.slice(0, 60);
        const seoDesc = extractSeoDescription(body);

        const hashnodeFrontmatter = [
            '---',
            `title: "${title}"`,
            `slug: ${safeSlug}`,
            `domain: darketype.hashnode.dev`,
            `canonical: "https://bmccall17.github.io/darketype/weblog/${slug}.html"`,
            `cover: "${ogImageUrl}"`,
            `seo_title: "${seoTitle}"`,
            `seo_description: "${seoDesc}"`,
            `og_image: "${ogImageUrl}"`,
        ];

        if (tags) hashnodeFrontmatter.push(`tags: ${tags}`);
        if (meta.series) hashnodeFrontmatter.push(`seriesSlug: ${meta.series}`);
        
        hashnodeFrontmatter.push('---', '');

        const finalContent = hashnodeFrontmatter.join('\n') + '\n' + newBody;

        fs.writeFileSync(path.join(HASHNODE_DIR, file), finalContent);

        // Add to manifest
        manifest[slug] = `https://darketype.hashnode.dev/${safeSlug}`;
        exportedCount++;
    }

    // Write manifest.json
    const manifestData = {
        _generated: new Date().toISOString(),
        posts: manifest,
        series: seriesAudit
    };
    fs.writeFileSync(path.join(HASHNODE_DIR, 'manifest.json'), JSON.stringify(manifestData, null, 2));
    console.log(`✅ successfully exported ${exportedCount} entries to .hashnode/`);
    console.log(`✅ generated manifest.json (${Object.keys(manifest).length} posts, ${Object.keys(seriesAudit).length} series)`);

    // Series audit log
    if (Object.keys(seriesAudit).length > 0) {
        console.log('\n📚 series audit:');
        for (const [series, entries] of Object.entries(seriesAudit)) {
            console.log(`  → "${series}" (${entries.length} entries)`);
            entries.forEach(e => console.log(`      - ${e.slug} — ${e.title}`));
        }
        console.log('  ⚠  ensure these series exist on Hashnode Dashboard before running hashnode:sync');
    }
}

build();
