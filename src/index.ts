import delay from "delay";
import puppeteer from "puppeteer";
import axios from "axios";

const qqid = process.env.QQID?.trim();
const remoteHostname = process.env.HOST?.trim();
const remoteCode = process.env.CODE?.trim();
const useHTTPS =
    process.env.USE_HTTPS?.trim().toLowerCase() == "false" ? false : true;

const browser = await puppeteer.launch({ 
	headless: true,
	// browser: "firefox"
});

async function qq() {
    console.log("starting qq login");
    await Promise.all((await browser.pages()).map((p) => p.close()));
    const page = await browser.newPage();
    await page.goto("https://y.qq.com");
    console.log("opened page");
    await page.click(".top_login__link");
    console.log("clicked to login");
    await page.waitForSelector("#login_frame", { timeout: 120 * 1000 });
    const frame1 = await (await page.$("#login_frame"))?.contentFrame();
    if (!frame1) return;
    console.log("got iframe 1");
    await frame1.waitForSelector("#ptlogin_iframe", { timeout: 120 * 1000 });
    const frame2 = await (await frame1.$("#ptlogin_iframe"))?.contentFrame();
    if (!frame2) return;
    console.log("got iframe 2");
    await frame2.waitForSelector(`#img_out_${qqid}`, { timeout: 120 * 1000 });
    await frame2.click(`#img_out_${qqid}`);
    console.log("logging in");
    await page.waitForFunction(() => !document.querySelector("#login_frame"));
    await delay(2000);
    const cookie = (await page.cookies())
        .map((v) => `${v.name}=${v.value}`)
        .join("; ");
    await axios
        .post(
            `http${
                useHTTPS ? "s" : ""
            }://${remoteHostname}/qqmusic/updateCookie`,
            {
                cookie,
                code: remoteCode,
            }
        )
        .catch((e) => {
            console.log("Cannot update remote cookie", e);
        });
    await page.close();
    console.log(cookie);
}

async function netease() {
    return new Promise(async (resolve) => {
        console.log("starting netease login");
        await Promise.all((await browser.pages()).map((p) => p.close()));
        const page = await browser.newPage();
        await page.goto("https://music.163.com");
        console.log("opened page");
        await page.click("a[data-action=login]");
        console.log("clicked to login");
        // await page.waitForSelector(".mrc-modal-container", {
        //     timeout: 120 * 1000,
        // });
        console.log("looking for model switch button");
        await (
            await page.waitForSelector("a ::-p-text(选择其他登录模式)")
        )?.click();
        console.log("switched login mode");
        await (await page.waitForSelector("#j-official-terms"))?.click();
        await (await page.waitForSelector("a ::-p-text(QQ登录)"))?.click();
        const waitForNewTap = setTimeout(() => {
            throw "Cannot find the new tab";
        }, 120 * 1000);
        await delay(5000);
        const loginPage = (await browser.pages()).find(
            (v) => v.url() != page.url()
        );
        clearTimeout(waitForNewTap);
        if (!loginPage) return;
        loginPage.on("close", async () => {
            console.log("login page closed");
            const cookie = (await page.cookies())
                .map((v) => `${v.name}=${v.value}`)
                .join("; ");
            await axios
                .post(
                    `http${
                        useHTTPS ? "s" : ""
                    }://${remoteHostname}/netease/updateCookie`,
                    {
                        cookie,
                        code: remoteCode,
                    }
                )
                .catch((e) => {
                    console.log("Cannot update remote cookie", e);
                });
            console.log(cookie);
            resolve(void 0);
        });
        console.log("switched to qq login page");
        await loginPage.waitForSelector("#ptlogin_iframe", {
            timeout: 120 * 1000,
        });
        const frame1 = await (
            await loginPage.$("#ptlogin_iframe")
        )?.contentFrame();
        if (!frame1) return;
        console.log("got iframe");
        await (
            await frame1.waitForSelector(`#img_out_${qqid}`, {
                timeout: 120 * 1000,
            })
        )?.click();
        console.log("logging in");
    });
}

(async () => {
    await qq();
    await netease();
    await browser.close();
})();
