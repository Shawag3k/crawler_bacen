import { PuppeteerCrawler, Dataset } from 'crawlee';
import puppeteer from 'puppeteer';

const startUrls = ['URL_DO_FORMULARIO_DE_BUSCA'];

const crawler = new PuppeteerCrawler({
    async requestHandler({ page, request, enqueueLinks }) {
        console.log(`Processing ${request.url}...`);

        if (request.url === 'URL_DO_FORMULARIO_DE_BUSCA') {
            // Preenche o formulário
            await page.type('SELETOR_DO_CAMPO_DE_BUSCA', 'TERMO_DE_BUSCA');
            await page.click('SELETOR_DO_BOTAO_DE_BUSCA');
            await page.waitForNavigation();

            // Coleta links dos resultados
            const links = await page.$$eval('SELETOR_DOS_LINKS_DOS_RESULTADOS', elements =>
                elements.map(element => element.href)
            );

            // Enfileira links para processamento
            await enqueueLinks({ urls: links });
        } else {
            // Acessa cada link e copia o conteúdo importante
            const content = await page.$eval('SELETOR_DO_CONTEUDO_IMPORTANTE', el => el.innerText);

            // Salva o conteúdo no Dataset
            await Dataset.pushData({ url: request.url, content });
        }
    },
    async failedRequestHandler({ request }) {
        console.log(`Request ${request.url} failed too many times.`);
    },
});

await crawler.run(startUrls);
