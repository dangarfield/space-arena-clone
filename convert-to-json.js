import fs from 'fs';
import path from 'path';

function parseMarkdownToJson(mdContent) {
    const items = [];
    const sections = mdContent.split('---\n\n').filter(s => s.trim());
    
    for (const section of sections) {
        if (!section.includes('##')) continue;
        
        const lines = section.split('\n');
        const item = { stats: {}, images: [] };
        let currentSection = null;
        
        for (const line of lines) {
            if (line.startsWith('## ')) {
                item.name = line.replace('## ', '').trim();
            } else if (line.startsWith('### Stats')) {
                currentSection = 'stats';
            } else if (line.startsWith('### Images')) {
                currentSection = 'images';
            } else if (line.startsWith('- **')) {
                const match = line.match(/- \*\*([^:]+):\*\* (.+)/);
                if (match && currentSection === 'stats') {
                    item.stats[match[1].trim()] = match[2].trim();
                }
            } else if (line.startsWith('![')) {
                const match = line.match(/!\[.*?\]\((.*?)\)/);
                if (match) {
                    item.images.push(match[1]);
                }
            } else if (line.trim() && !line.startsWith('#') && !item.description) {
                item.description = line.trim();
            }
        }
        
        if (item.name) {
            items.push(item);
        }
    }
    
    return items;
}

function convertAll() {
    const categories = ['ships', 'weapons', 'defense', 'utility'];
    const outputDir = 'src/data';
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (const category of categories) {
        const mdPath = path.join('docs/parsed', `${category}.md`);
        
        if (fs.existsSync(mdPath)) {
            const mdContent = fs.readFileSync(mdPath, 'utf8');
            const jsonData = parseMarkdownToJson(mdContent);
            
            const outputPath = path.join(outputDir, `${category}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf8');
            
            console.log(`✓ Converted ${category}.md -> ${category}.json (${jsonData.length} items)`);
        }
    }
    
    console.log('\nConversion complete!');
}

convertAll();
