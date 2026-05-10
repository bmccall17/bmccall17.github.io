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

    // fix hashnode manifest path: from weblog/ perspective it's at ../../.hashnode/
    html = html.replace("fetch('../.hashnode/manifest.json')", "fetch('../../.hashnode/manifest.json')");

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

        const SERIES_LABELS = {
            'darketype-devlog': 'devlog',
            'crm-agent828': 'crm',
            'agent828-build-arc': 'agent828',
        };
        const seriesRaw = meta.series || '';
        const seriesLabel = SERIES_LABELS[seriesRaw] || (seriesRaw ? seriesRaw : null);

        return {
            file,
            slug,
            title: meta.title || file, // Fallback title
            description: extractDescription(content),
            date: meta.date || created.toISOString().split('T')[0], // Frontmatter date
            timestampIso: created.toISOString(),
            epoch: created.getTime(),
            state: meta.state || 'void',
            series: seriesLabel,
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
                    <span class="dim">_${post.state}</span>${post.series ? ` <span class="series-tag">[${post.series}]</span>` : ''}
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

    // 7. Sync STATE_COLORS in weblog/index.html with all states from entries
    const allStates = [...new Set(posts.map(p => p.state))].sort();
    const STATE_COLOR_DEFAULTS = {
        'shipped': '#39d353', 'learning': '#f0a500', 'mess': '#cf222e',
        'debugging': '#ff6b35', 'optimistic': '#58a6ff', 'seed': '#7c3aed',
        'void': '#444', 'broken': '#da3633', 'frustrated': '#d29922'
    };
    // Fallback palette for any truly new states
    const FALLBACK_COLORS = ['#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#be5046'];
    let fallbackIdx = 0;

    const stateEntries = allStates.map(s => {
        const color = STATE_COLOR_DEFAULTS[s] || FALLBACK_COLORS[fallbackIdx++ % FALLBACK_COLORS.length];
        return `                    '${s}': { color: '${color}', label: '_${s}' }`;
    });
    const newStateBlock = `const STATE_COLORS = {\n${stateEntries.join(',\n')},\n                };`;

    let weblogHtml = fs.readFileSync(INDEX_FILE, 'utf-8');
    weblogHtml = weblogHtml.replace(
        /const STATE_COLORS = \{[\s\S]*?\};/,
        newStateBlock
    );

    // 8. Update footer counters in weblog/index.html
    const stateCount = allStates.length;
    const entryCount = posts.length;
    weblogHtml = weblogHtml.replace(
        /darketype weblog — \d+ entries across \d+ emotional states\./,
        `darketype weblog — ${entryCount} entries across ${stateCount} emotional states.`
    );
    fs.writeFileSync(INDEX_FILE, weblogHtml);
    console.log(`✅ synced STATE_COLORS (${stateCount} states) and weblog footer (${entryCount} entries)`);

    // 9. Update footer counter in darketype/index.html (the manifesto landing page)
    const DARKETYPE_INDEX = path.join(__dirname, '../darketype/index.html');
    if (fs.existsSync(DARKETYPE_INDEX)) {
        let darketypeHtml = fs.readFileSync(DARKETYPE_INDEX, 'utf-8');
        darketypeHtml = darketypeHtml.replace(
            /darketype v0\.2 — \d+ mess entries and counting\./,
            `darketype v0.2 — ${entryCount} mess entries and counting.`
        );
        fs.writeFileSync(DARKETYPE_INDEX, darketypeHtml);
        console.log(`✅ updated darketype/index.html footer (${entryCount} entries)`);
    }
}

build();
