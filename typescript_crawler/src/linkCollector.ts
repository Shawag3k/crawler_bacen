import { launch } from 'puppeteer';

export const startLinkCollection = async (): Promise<string[]> => {
    const browser = await launch();
    const page = await browser.newPage();
    await page.goto('URL_RESULTADO_FORMULARIO');

    const links = await page.evaluate(() => {
        const anchors = document.querySelectorAll('a');
        return Array.from(anchors).map(anchor => anchor.href);
    });

    await browser.close();
    return links;
};
