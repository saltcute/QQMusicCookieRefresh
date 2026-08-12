import axios from "axios";
import delay from "delay";
import { Browser } from "puppeteer";
import { Config } from "type.js";

export default async function qq(browser: Browser, config: Config) {
    console.log("QQ Music login begins.");
    await Promise.all((await browser.pages()).map((p) => p.close()));
    const page = await browser.newPage();

    await page.goto("https://y.qq.com");
    console.log("Opened homepage.");

    await page.click(".top_login__link");
    console.log("Clicked login button.");

    await page.waitForSelector("#login_frame", { timeout: 120 * 1000 });
    const frame1 = await (await page.$("#login_frame"))?.contentFrame();
    if (!frame1) return;
    console.log("Got login iframe.");
    await frame1.waitForSelector("#ptlogin_iframe", { timeout: 120 * 1000 });

    const frame2 = await (await frame1.$("#ptlogin_iframe"))?.contentFrame();
    if (!frame2) return;
    console.log("Got local QQ client login icon.");
    await frame2.waitForSelector(`#img_out_${config.qqid}`, { timeout: 120 * 1000 });
    await frame2.click(`#img_out_${config.qqid}`);
    console.log("Logging in.");
    await page.waitForFunction(() => !document.querySelector("#login_frame"));
    await delay(2000);
    const cookie = (await page.cookies())
        .map((v) => `${v.name}=${v.value}`)
        .join("; ");
    await axios
        .post(
            `http${config.useHTTPS ? "s" : ""
            }://${config.remoteHostname}/qqmusic/updateCookie`,
            {
                cookie,
                code: config.remoteCode,
            }
        )
        .catch((e) => {
            console.log("Cannot update remote cookie", e);
        });
    await page.close();
    console.log(cookie);
}