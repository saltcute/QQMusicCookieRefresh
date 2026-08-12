import axios from "axios";
import delay from "delay";
import { Browser } from "puppeteer";
import { Config } from "type.js";

export default async function netease(browser: Browser, config: Config) {
    return new Promise(async (resolve) => {
        console.log("Netease Cloud Music login begins.");
        await Promise.all((await browser.pages()).map((p) => p.close()));
        const page = await browser.newPage();

        await page.goto("https://music.163.com");
        console.log("Opened homepage.");

        await page.click("a[data-action=login]");
        console.log("Clicked login button.");

        console.log("Waiting for Login Mode switch button.");
        await (
            await page.waitForSelector("a ::-p-text(选择其他登录模式)")
        )?.click();
        console.log("Switched Login Mode.");

        await (await page.waitForSelector("#j-official-terms"))?.click();
        console.log("Agreed TOS.");

        await (await page.waitForSelector("a ::-p-text(QQ登录)"))?.click();
        console.log("Opening a new tab for QQ login.");

        const waitForNewTap = setTimeout(() => {
            throw "Cannot find QQ login tab.";
        }, 120 * 1000);
        await delay(5000);
        const loginPage = (await browser.pages()).find(
            (v) => v.url().includes("qq")
        );
        console.log("Opened a new tab for QQ login.");
        clearTimeout(waitForNewTap);

        if (!loginPage) return;
        loginPage.on("close", async () => {
            console.log("QQ login page closed.");
            const cookie = (await page.cookies())
                .map((v) => `${v.name}=${v.value}`)
                .join("; ");
            await axios
                .post(
                    `http${config.useHTTPS ? "s" : ""
                    }://${config.remoteHostname}/netease/updateCookie`,
                    {
                        cookie,
                        code: config.remoteCode,
                    }
                )
                .catch((e) => {
                    console.log("Cannot update remote cookie", e);
                });
            console.log(cookie);
            resolve(void 0);
        });

        console.log("Switched to QQ login page");

        console.log("Waiting for QQ login iframe.")
        await loginPage.waitForSelector("#ptlogin_iframe", {
            timeout: 120 * 1000,
        });
        const frame1 = await (
            await loginPage.$("#ptlogin_iframe")
        )?.contentFrame();
        if (!frame1) throw "Cannot get QQ login iframe";

        console.log("Got QQ login iframe");

        console.log("Waiting for local QQ client login icon.");
        await (
            await frame1.waitForSelector(`#img_out_${config.qqid}`, {
                timeout: 120 * 1000,
            })
        )?.click();
        console.log("Logging in.");
    });
}