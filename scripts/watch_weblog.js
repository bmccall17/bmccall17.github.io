const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const ENTRIES_DIR = path.join(__dirname, '../darketype/entries');

console.log(`👁️  Watching for changes in ${ENTRIES_DIR}...`);

let debounceTimer;

const rebuild = () => {
    console.log('🔄 Change detected. Rebuilding weblog...');
    exec('node scripts/build_weblog.js', (err, stdout, stderr) => {
        if (err) {
            console.error('❌ Build failed:', err);
            return;
        }
        if (stdout) console.log(stdout.trim());
        if (stderr) console.error(stderr.trim());
    });
};

fs.watch(ENTRIES_DIR, (eventType, filename) => {
    if (filename && filename.endsWith('.md')) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(rebuild, 100);
    }
});
