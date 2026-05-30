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
await page.getByRole('button',{name:/நாட்காட்டி/}).first().click();
await page.waitForTimeout(1200);
const btns=await page.locator('button').allTextContents();
btns.forEach((t,i)=>console.log(i,JSON.stringify(t.trim())));
await browser.close();
