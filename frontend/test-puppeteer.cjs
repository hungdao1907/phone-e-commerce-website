const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('[Card')) {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  await page.goto('http://localhost:3000/phone/iphone', { waitUntil: 'networkidle0' });
  await browser.close();
})();
