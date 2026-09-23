const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Go to iphone page
  await page.goto('http://localhost:3000/phone/iphone', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'iphone_page.png' });
  
  // Go to all products page
  await page.goto('http://localhost:3000/products', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'products_page.png' });

  await browser.close();
})();
