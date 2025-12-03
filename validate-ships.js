import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const shipsDir = 'src/data/ships';
const htmlDir = 'docs/wiki-html';

// Get all ship files
const shipFiles = fs.readdirSync(shipsDir)
  .filter(f => f.endsWith('.json') && f !== 'index.json');

console.log(`Validating ${shipFiles.length} ships...\n`);

shipFiles.forEach(shipFile => {
  const shipId = shipFile.replace('.json', '');
  const shipData = JSON.parse(fs.readFileSync(path.join(shipsDir, shipFile), 'utf8'));
  
  // Find corresponding HTML file
  const htmlFile = path.join(htmlDir, `${shipId}.html`);
  
  if (!fs.existsSync(htmlFile)) {
    console.log(`⚠️  ${shipData.name}: No HTML file found`);
    return;
  }
  
  const html = fs.readFileSync(htmlFile, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  // Extract data from HTML
  const extracted = extractShipData(doc, shipData.name);
  
  // Compare and update
  const updated = {
    ...shipData,
    stats: extracted.stats || shipData.stats,
    description: extracted.description || shipData.description
  };
  
  // Write back
  fs.writeFileSync(
    path.join(shipsDir, shipFile),
    JSON.stringify(updated, null, 2),
    'utf8'
  );
  
  console.log(`✓ ${shipData.name}: Updated`);
  if (extracted.stats) {
    console.log(`  Stats: ${Object.keys(extracted.stats).length} fields`);
  }
});

function extractShipData(doc, shipName) {
  const stats = {};
  let description = '';
  
  // Extract from infobox
  const infobox = doc.querySelector('.portable-infobox');
  if (infobox) {
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
  
  // Extract from specifications list
  const specsList = doc.querySelector('#Specifications');
  if (specsList) {
    const ul = specsList.closest('h2')?.nextElementSibling;
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
  
  // Extract description
  const blockquote = doc.querySelector('blockquote p');
  if (blockquote) {
    description = blockquote.textContent.trim();
  }
  
  return { stats, description };
}

console.log('\nValidation complete!');
