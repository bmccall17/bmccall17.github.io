const fs = require('fs');
const path = require('path');

const ENTRIES_DIR = path.join(__dirname, '../darketype/entries');
const INDEX_FILE = path.join(__dirname, '../darketype/weblog/index.html');

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

function build() {
    console.log('🚧 building weblog index...');

    // 1. read entries
    const files = fs.readdirSync(ENTRIES_DIR).filter(f => f.endsWith('.md') && f !== 'TEMPLATE.md');

    const posts = files.map(file => {
        const filePath = path.join(ENTRIES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const stats = fs.statSync(filePath);
        const meta = parseFrontmatter(content);

        // Use creation time (birthtime) if available, fall back to mtime
        const created = stats.birthtimeMs ? stats.birthtime : stats.mtime;

        return {
            file,
            title: meta.title || file, // Fallback title
            date: meta.date || '1970-01-01', // Frontmatter date
            // Actual file creation timestamp
            timestampIso: created.toISOString(),
            epoch: created.getTime(),
            state: meta.state || 'void',
            path: `../entry.html?log=entries/${file}`
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
}

build();
