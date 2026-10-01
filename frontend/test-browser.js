const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));

  console.log('Navigating to home...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  console.log('Clicking on Điện thoại link...');
  // Assuming the nav has a link with text "Điện thoại" or similar. Or we can just evaluate a history push
  await page.evaluate(() => {
    window.history.pushState({}, '', '/phone/iphone');
    window.dispatchEvent(new Event('popstate'));
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Navigating to checkout...');
  await page.evaluate(() => {
    window.history.pushState({}, '', '/checkout');
    window.dispatchEvent(new Event('popstate'));
  });
  
  await new Promise(r => setTimeout(r, 3000));

  await browser.close();
})();
