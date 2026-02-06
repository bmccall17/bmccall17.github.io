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
        const content = fs.readFileSync(path.join(ENTRIES_DIR, file), 'utf-8');
        const meta = parseFrontmatter(content);
        return {
            file,
            title: meta.title || file,
            date: meta.date || '1970-01-01',
            state: meta.state || 'void',
            path: `../entry.html?log=entries/${file}`
        };
    });

    // 2. sort by date desc
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. generate html
    const listHtml = posts.map(post => `
                <li>
                    <span class="dim">[${post.date}]</span>
                    <a href="${post.path}">${post.title.toLowerCase()}</a>
                    <span class="dim">_${post.state}</span>
                </li>`).join('\n');

    // 4. inject into index.html
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
        '\n' + listHtml + '\n                ' +
        html.substring(endIndex);

    fs.writeFileSync(INDEX_FILE, newHtml);
    console.log(`✅ indexed ${posts.length} messes.`);
    console.log(`   - latest: ${posts[0]?.title}`);
}

build();
