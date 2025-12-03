const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function downloadWikiPages() {
  // Read the pages list
  const pagesData = JSON.parse(fs.readFileSync('docs/wiki-pages-list.json', 'utf8'));
  const pages = pagesData.pages;
  
  // Create output directory
  const outputDir = 'docs/wiki-html';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log(`Starting download of ${pages.length} pages...`);
  
  for (let i = 0; i < pages.length; i++) {
    const pageName = pages[i];
    const url = `https://spacearena.fandom.com/wiki/${encodeURIComponent(pageName.replace(/ /g, '_'))}`;
    
    try {
      console.log(`[${i + 1}/${pages.length}] Downloading: ${pageName}`);
      
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Get only the content we need
      const content = await page.evaluate(() => {
        const contentEl = document.getElementById('mw-content-text');
        return contentEl ? contentEl.innerHTML : '';
      });
      
      // Save to file (sanitize filename)
      const filename = pageName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, content, 'utf8');
      
      console.log(`  ✓ Saved to ${filename}`);
      
      // Small delay to be respectful to the server
      await page.waitForTimeout(500);
      
    } catch (error) {
      console.error(`  ✗ Error downloading ${pageName}: ${error.message}`);
    }
  }
  
  await browser.close();
  console.log(`\nDownload complete! Files saved to ${outputDir}/`);
}

downloadWikiPages().catch(console.error);
