import fs from 'fs';
import path from 'path';
import { launch } from 'puppeteer';

export const startPDFDownload = async (links: string[]) => {
    const browser = await launch();
    const page = await browser.newPage();

    for (const link of links) {
        await page.goto(link);

        const content = await page.evaluate(() => document.body.innerText);
        const pdfPath = path.resolve(`./downloads/${path.basename(link)}.pdf`);

        fs.writeFileSync(pdfPath, content);
    }

    await browser.close();
};
