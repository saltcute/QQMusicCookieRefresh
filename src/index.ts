import puppeteer from "puppeteer";
import qq from "qq.js";
import netease from "netease.js";



const qqid = process.env.QQID?.trim();
const remoteHostname = process.env.HOST?.trim();
const remoteCode = process.env.CODE?.trim();
const useHTTPS =
    process.env.USE_HTTPS?.trim().toLowerCase() == "false" ? false : true;

if (!qqid || !remoteCode || !remoteHostname) {
    console.log("Missing arguments");
    process.exit(1)
}

const browser = await puppeteer.launch({
    // headless: true,
    headless: false,
    // executablePath: "/usr/bin/google-chrome",
    browser: "firefox",
    extraPrefsFirefox: {
        'network.lna.enabled': false, // Disables local network access restrictions/prompts
    }
});

const config = { useHTTPS, remoteCode, remoteHostname, qqid }

await qq(browser, config);
await netease(browser, config);

await browser.close();