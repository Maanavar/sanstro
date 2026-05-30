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
await page.waitForTimeout(1500);
const btns=await page.locator('button').allTextContents();
console.log('BUTTONS',btns.length);
btns.forEach((t,i)=>console.log('B',i,JSON.stringify(t.trim())));
const links=await page.locator('a').allTextContents();
console.log('LINKS',links.length);
links.forEach((t,i)=>console.log('A',i,JSON.stringify(t.trim())));
const tabs=await page.locator('[role="tab"]').allTextContents();
console.log('TABS',tabs.length);
tabs.forEach((t,i)=>console.log('T',i,JSON.stringify(t.trim())));
await browser.close();
