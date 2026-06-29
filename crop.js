const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function main() {
    const img = await loadImage('/home/bam/.gemini/antigravity-ide/brain/08901957-0944-41d9-aa79-37e731cf53b6/agent_ready_repo_1782767473916.png');
    const targetWidth = 1600;
    const targetHeight = 840;
    
    const canvas = createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    
    const scale = targetWidth / img.width;
    const scaledHeight = img.height * scale;
    const yOffset = (scaledHeight - targetHeight) / 2;
    
    ctx.drawImage(img, 0, -yOffset, targetWidth, scaledHeight);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('assets/social/og/2026-06-29_agent_ready_is_becoming_part_of_repo_ready.png', buffer);
    fs.mkdirSync('.hashnode/assets', { recursive: true });
    fs.writeFileSync('.hashnode/assets/2026-06-29_agent_ready_is_becoming_part_of_repo_ready.png', buffer);
}

main().catch(console.error);
