import delay from "delay";
import puppeteer from "puppeteer";
import axios from 'axios';

const qqid = process.env.QQID?.trim();
const remoteHostname = process.env.HOST?.trim();
const remoteCode = process.env.CODE?.trim();
const useHTTPS = process.env.USE_HTTPS?.trim().toLowerCase() == "false" ? false : true;

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
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
    await page.waitForFunction(() => !document.querySelector("#login_frame"));
    await delay(2000);
    const cookie = (await page.cookies()).map(v => `${v.name}=${v.value}`).join("; ");
    await axios.post(`http${useHTTPS ? "s" : ""}://${remoteHostname}/qqmusic/updateCookie`, {
        cookie, code: remoteCode
    }).catch((e) => {
        console.log("Cannot update remote cookie", e);
    })
    console.log(cookie);
    browser.close();
})()