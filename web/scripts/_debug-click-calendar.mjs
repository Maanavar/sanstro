import { chromium } from "playwright";
const email=process.env.SCREENSHOT_EMAIL;
const password=process.env.SCREENSHOT_PASSWORD;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1512,height:2000}});
await page.goto("http://127.0.0.1:3000/dashboard",{waitUntil:"networkidle"});
if(page.url().includes('/login')){
  const form=page.locator('form').first();
  await form.locator('input[type="email"]').fill(email);
  await form.locator('input[type="password"]').fill(password);
  await form.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard',{timeout:60000});
  await page.waitForLoadState('networkidle');
}
const btn = page.getByRole('button',{name:/நாட்காட்டி/}).first();
await btn.click({force:true});
await page.waitForTimeout(1800);
console.log('URL',page.url());
const h2=await page.locator('h2').allTextContents();
console.log('H2',h2.map(x=>x.trim()));
const body=await page.textContent('body');
console.log('HAS_PANCHA', body?.includes('பஞ்சாங்கம்'));
console.log('HAS_CAL', body?.includes('நாட்காட்டி'));
await page.screenshot({path:'artifacts/screenshots/_debug-after-calendar-click.png',fullPage:true});
await browser.close();
