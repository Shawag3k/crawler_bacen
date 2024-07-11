import { launch } from 'puppeteer';

export const startFormFilling = async () => {
    const browser = await launch();
    const page = await browser.newPage();
    await page.goto('URL_DO_FORMULARIO');

    await page.type('selector_do_campo', 'valor');
    await page.click('selector_do_botao');

    await page.waitForNavigation();

    await browser.close();
};
