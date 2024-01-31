import puppeteer, { Frame } from "puppeteer";

const qqid = process.env.QQID;

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://y.qq.com");
    await page.click(".top_login__link");
    await page.waitForSelector("#login_frame");
    const frame1 = await (await page.$("#login_frame"))?.contentFrame();
    if (!frame1) return;
    console.log("got ifram 1")
    await frame1.waitForSelector("#ptlogin_iframe");
    const frame2 = await (await frame1.$("#ptlogin_iframe"))?.contentFrame();
    if (!frame2) return;
    console.log("got ifram 2")
    await frame2.waitForSelector(`#img_out_${qqid}`);
    await frame2.click(`#img_out_${qqid}`);
    const cookie = (await page.cookies()).map(v => `${v.name}=${v.value}`).join("; ");
    console.log(cookie);
    browser.close();
})()