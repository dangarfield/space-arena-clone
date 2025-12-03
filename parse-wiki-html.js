const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Keywords to categorize pages
const categoryKeywords = {
  ships: ['ship', 'corvette', 'frigate', 'destroyer', 'cruiser', 'battleship', 'carrier', 'fighter', 'acolyte', 'arbiter', 'baron', 'crusader', 'duke', 'hammerhead', 'hawk', 'interceptor', 'javelin', 'miran', 'phantom', 'rapier', 'raptor', 'raven', 'sparrow', 'viper', 'wraith', 'arrow', 'broadsword', 'dart', 'morningstar', 'scythe', 'valkyrie', 'vindicator', 'warrior', 'wanderer', 'wing'],
  weapons: ['weapon', 'gun', 'cannon', 'laser', 'missile', 'rocket', 'railgun', 'turret', 'launcher', 'chaingun', 'vulcan', 'gauss', 'pulse', 'quantum', 'flak', 'hydra', 'emp', 'torpedo', 'warhead', 'scorpion', 'impact', 'junk', 'mine', 'burst ray', 'doomsday', 'capital cannon'],
  defense: ['armor', 'shield', 'reactive', 'steel', 'plasma', 'solar', 'ballistic armor', 'combat shield', 'battle shield', 'war shield', 'bunker'],
  utility: ['reactor', 'engine', 'drive', 'thruster', 'repair bay', 'point defense', 'warp', 'ion drive', 'vectored', 'afterburner', 'armored reactor'],
  game_mechanics: ['battle', 'arena', 'campaign', 'league', 'rating', 'experience', 'credit', 'celestium', 'level', 'blueprint', 'upgrade', 'modification', 'chip']
};

function categorize(pageName) {
  const searchText = pageName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      return category;
    }
  }
  return 'other';
}

function extractContent(html, pageName) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  const stats = {};
  let description = '';
  let images = [];
  
  // Extract infobox data
  const infobox = doc.querySelector('.portable-infobox');
  if (infobox) {
    // Extract images
    const imageElements = infobox.querySelectorAll('.pi-image-thumbnail');
    imageElements.forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src');
      if (src && !src.includes('data:image')) {
        // Get the full resolution URL
        const fullUrl = src.replace(/\/scale-to-width-down\/\d+/, '').replace(/\/revision\/latest.*/, '/revision/latest');
        images.push(fullUrl);
      }
    });
    
    const dataItems = infobox.querySelectorAll('.pi-data');
    dataItems.forEach(item => {
      const label = item.querySelector('.pi-data-label');
      const value = item.querySelector('.pi-data-value');
      if (label && value) {
        const labelText = label.textContent.trim();
        const valueText = value.textContent.trim();
        if (labelText && valueText) {
          stats[labelText] = valueText;
        }
      }
    });
  }
  
  // Extract description from blockquote or first paragraph
  const blockquote = doc.querySelector('blockquote p');
  if (blockquote) {
    description = blockquote.textContent.trim();
  } else {
    const firstPara = doc.querySelector('.mw-parser-output > p');
    if (firstPara && firstPara.textContent.trim()) {
      description = firstPara.textContent.trim();
    }
  }
  
  // Extract specifications list
  const specsList = doc.querySelector('h2 .mw-headline#Specifications');
  if (specsList) {
    const ul = specsList.closest('h2').nextElementSibling;
    if (ul && ul.tagName === 'UL') {
      const items = ul.querySelectorAll('li');
      items.forEach(item => {
        const text = item.textContent.trim();
        const match = text.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          stats[match[1].trim()] = match[2].trim();
        }
      });
    }
  }
  
  return {
    title: pageName,
    description,
    stats,
    images,
    category: categorize(pageName)
  };
}

function parseAllPages() {
  const inputDir = 'docs/wiki-html';
  const outputDir = 'docs/parsed';
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.html'));
  console.log(`Parsing ${files.length} HTML files...`);
  
  const allData = {};
  
  for (const file of files) {
    const filepath = path.join(inputDir, file);
    const pageName = file.replace('.html', '').replace(/_/g, ' ');
    
    try {
      const html = fs.readFileSync(filepath, 'utf8');
      const data = extractContent(html, pageName);
      const category = data.category;
      
      if (!allData[category]) {
        allData[category] = [];
      }
      
      allData[category].push(data);
      console.log(`✓ ${pageName} -> ${category}`);
    } catch (error) {
      console.error(`✗ Error parsing ${pageName}: ${error.message}`);
    }
  }
  
  // Write category files
  for (const [category, items] of Object.entries(allData)) {
    const markdown = generateMarkdown(category, items);
    const filename = path.join(outputDir, `${category}.md`);
    fs.writeFileSync(filename, markdown, 'utf8');
    console.log(`\nCreated ${filename} with ${items.length} items`);
  }
  
  console.log('\nParsing complete!');
}

function generateMarkdown(category, items) {
  let md = `# ${category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}\n\n`;
  md += `Total items: ${items.length}\n\n`;
  md += `---\n\n`;
  
  items.sort((a, b) => a.title.localeCompare(b.title));
  
  for (const item of items) {
    md += `## ${item.title}\n\n`;
    
    if (item.description) {
      md += `${item.description}\n\n`;
    }
    
    if (item.images && item.images.length > 0) {
      md += `### Images\n\n`;
      item.images.forEach((img, idx) => {
        md += `![${item.title} ${idx + 1}](${img})\n\n`;
      });
    }
    
    if (Object.keys(item.stats).length > 0) {
      md += `### Stats\n\n`;
      for (const [key, value] of Object.entries(item.stats)) {
        md += `- **${key}:** ${value}\n`;
      }
      md += `\n`;
    }
    
    md += `---\n\n`;
  }
  
  return md;
}

parseAllPages();
