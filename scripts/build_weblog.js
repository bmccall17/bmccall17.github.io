const fs = require('fs');
const path = require('path');

const ENTRIES_DIR = path.join(__dirname, '../darketype/entries');
const INDEX_FILE = path.join(__dirname, '../darketype/weblog/index.html');
const ENTRY_TEMPLATE = path.join(__dirname, '../darketype/entry.html');
const WEBLOG_DIR = path.join(__dirname, '../darketype/weblog');

function parseFrontmatter(content) {
    const match = content.match(/^---([\s\S]*?)---/);
    if (!match) return {};
    const frontmatter = match[1];
    const meta = {};
    frontmatter.split('\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val) meta[key.trim()] = val.join(':').trim().replace(/['"]/g, '');
    });
    return meta;
}

function extractDescription(content) {
    // strip frontmatter
    let body = content.replace(/^---[\s\S]*?---/, '').trim();
    // strip markdown syntax: headers, bold, italic, links, images, code blocks
    body = body.replace(/```[\s\S]*?```/g, '');
    body = body.replace(/`[^`]+`/g, '');
    body = body.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
    body = body.replace(/\[[^\]]*\]\([^)]*\)/g, (m) => m.replace(/\[([^\]]*)\]\([^)]*\)/, '$1'));
    body = body.replace(/^#{1,6}\s+/gm, '');
    body = body.replace(/[*_~]+/g, '');
    body = body.replace(/\n+/g, ' ').trim();
    return body.slice(0, 160).trim();
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateEntryPage(post, entryHtml) {
    let html = entryHtml;
    const escapedTitle = escapeHtml(post.title);
    const escapedDesc = escapeHtml(post.description);
    const ogImage = `https://bmccall17.github.io/assets/social/og/${post.slug}.png`;
    const ogUrl = `https://bmccall17.github.io/darketype/weblog/${post.slug}.html`;

    // update <title>
    html = html.replace(/<title>.*?<\/title>/, `<title>darketype // ${escapedTitle}</title>`);

    // update OG tags
    html = html.replace(/property="og:title" content="[^"]*"/, `property="og:title" content="${escapedTitle}"`);
    html = html.replace(/property="og:description"[\s\n]*content="[^"]*"/,
        `property="og:description" content="${escapedDesc}"`);
    html = html.replace(/property="og:image" content="[^"]*"/, `property="og:image" content="${ogImage}"`);
    html = html.replace(/property="og:image:width" content="[^"]*"/, `property="og:image:width" content="1200"`);
    html = html.replace(/property="og:image:height" content="[^"]*"/, `property="og:image:height" content="630"`);
    html = html.replace(/property="og:url" content="[^"]*"/, `property="og:url" content="${ogUrl}"`);

    // update Twitter tags
    html = html.replace(/name="twitter:title" content="[^"]*"/, `name="twitter:title" content="${escapedTitle}"`);
    html = html.replace(/name="twitter:description"[\s\n]*content="[^"]*"/,
        `name="twitter:description" content="${escapedDesc}"`);
    html = html.replace(/name="twitter:image" content="[^"]*"/, `name="twitter:image" content="${ogImage}"`);

    // fix paths (entry.html is at darketype/, generated pages at darketype/weblog/)
    html = html.replace('href="../assets/favicons/weblog.svg"', 'href="../../assets/favicons/weblog.svg"');
    html = html.replace('href="css/style.css"', 'href="../css/style.css"');
    html = html.replace('src="scripts/viscous.js"', 'src="../scripts/viscous.js"');
    html = html.replace('src="scripts/sidebar.js"', 'src="../scripts/sidebar.js"');

    // fix nav link: from weblog/ perspective, index is in same dir
    html = html.replace('href="weblog/index.html"', 'href="index.html"');

    // replace query-param entry loading with hardcoded path
    html = html.replace(
        "const entry = params.get('log'); // e.g., 'entries/2026...md'",
        `const entry = '../entries/${post.file}';`
    );

    // remove the no-entry error check since entry is always set
    html = html.replace(
        /if \(!entry\) \{[\s\S]*?return;\s*\}/,
        '// entry path is hardcoded by build'
    );

    return html;
}

function build() {
    console.log('🚧 building weblog index...');

    // 1. read entries
    const files = fs.readdirSync(ENTRIES_DIR).filter(f => f.endsWith('.md') && f !== 'TEMPLATE.md');

    const posts = files.map(file => {
        const filePath = path.join(ENTRIES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const stats = fs.statSync(filePath);
        const meta = parseFrontmatter(content);

        // Use frontmatter date, fall back to creation time if not available
        let created = meta.date ? new Date(meta.date) : new Date(NaN);
        if (isNaN(created.getTime())) {
            created = stats.birthtimeMs ? stats.birthtime : stats.mtime;
        }

        const slug = file.replace(/\.md$/, '');

        return {
            file,
            slug,
            title: meta.title || file, // Fallback title
            description: extractDescription(content),
            date: meta.date || created.toISOString().split('T')[0], // Frontmatter date
            timestampIso: created.toISOString(),
            epoch: created.getTime(),
            state: meta.state || 'void',
            path: `${slug}.html`
        };
    });

    // 2. sort by creation time desc (newest first)
    posts.sort((a, b) => b.epoch - a.epoch);

    // 3. Generate JSON Manifest (for dynamic loading)
    const jsonPath = path.join(__dirname, '../darketype/entries.json');
    fs.writeFileSync(jsonPath, JSON.stringify(posts, null, 2));
    console.log(`✅ generated entries.json with ${posts.length} entries.`);

    // 4. Update HTML (Static Fallback)
    const listHtml = posts.map(post => `
                <li>
                    <span class="dim">[${post.timestampIso.split('T')[0]}]</span>
                    <a href="${post.path}" data-title="${post.title}" data-epoch="${post.epoch}">${post.title.toLowerCase()}</a>
                    <span class="dim">_${post.state}</span>
                </li>`).join('\n');

    let html = fs.readFileSync(INDEX_FILE, 'utf-8');
    const startMarker = '<ul class="mess-list">';
    const endMarker = '</ul>';

    const startIndex = html.indexOf(startMarker);
    const endIndex = html.indexOf(endMarker, startIndex);

    if (startIndex === -1 || endIndex === -1) {
        console.error('❌ markers not found in index.html');
        return;
    }

    const newHtml = html.substring(0, startIndex + startMarker.length) +
        '\n' + listHtml + '\n            ' +
        html.substring(endIndex);

    fs.writeFileSync(INDEX_FILE, newHtml);
    console.log(`✅ updated index.html`);

    // 5. generate heatmap data — rich objects with date, state, title, path
    const heatmapData = posts.map(p => ({
        date: (p.date || p.timestampIso).slice(0, 10), // always YYYY-MM-DD
        state: p.state || 'void',
        title: p.title,
        path: p.path
    }));
    fs.writeFileSync(path.join(__dirname, '../heatmap.json'), JSON.stringify(heatmapData, null, 2));
    console.log('✅ generated heatmap.json');

    // 6. Generate per-entry static HTML pages
    const entryHtml = fs.readFileSync(ENTRY_TEMPLATE, 'utf-8');
    let generated = 0;
    for (const post of posts) {
        const pageHtml = generateEntryPage(post, entryHtml);
        const outPath = path.join(WEBLOG_DIR, `${post.slug}.html`);
        fs.writeFileSync(outPath, pageHtml);
        generated++;
    }
    console.log(`✅ generated ${generated} static entry pages in weblog/`);
}

build();
