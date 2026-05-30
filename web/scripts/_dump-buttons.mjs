import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 2000 } });
await page.goto("http://127.0.0.1:3000/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const texts = await page.locator("button").allTextContents();
console.log("BUTTON_COUNT", texts.length);
texts.forEach((t, i) => console.log(i, JSON.stringify(t.trim())));
await browser.close();
