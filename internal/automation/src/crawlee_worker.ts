import { PlaywrightCrawler } from 'crawlee';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface CrawlData {
    tipoDocumento?: string;
    numero?: string;
    conteudo?: string;
    dataInicioBusca?: string;
    dataFimBusca?: string;
    results?: string[];
}

const crawler = new PlaywrightCrawler({
    headless: true,
    requestHandler: async ({ page, request }) => {
        const { tipoDocumento, numero, conteudo, dataInicioBusca, dataFimBusca } = request.userData as CrawlData;

        // Navegar até a página com o formulário
        await page.goto('https://www.bcb.gov.br/estabilidadefinanceira/buscanormas');
        console.log('Página carregada');

        // Preencher os campos do formulário
        if (tipoDocumento) await page.selectOption('#tipoDocumento', tipoDocumento);
        if (numero) await page.fill('#numero', numero);
        if (conteudo) await page.fill('#conteudo', conteudo);
        if (dataInicioBusca) await page.fill('#dataInicioBusca', dataInicioBusca);
        if (dataFimBusca) await page.fill('#dataFimBusca', dataFimBusca);
        console.log('Campos do formulário preenchidos');

        // Verificar se os campos foram preenchidos corretamente
        const formStatus = {
            tipoDocumento: (await page.$eval('#tipoDocumento', (el: HTMLSelectElement) => el.value)) === tipoDocumento,
            numero: (await page.$eval('#numero', (el: HTMLInputElement) => el.value)) === numero,
            conteudo: (await page.$eval('#conteudo', (el: HTMLInputElement) => el.value)) === conteudo,
            dataInicioBusca: (await page.$eval('#dataInicioBusca', (el: HTMLInputElement) => el.value)) === dataInicioBusca,
            dataFimBusca: (await page.$eval('#dataFimBusca', (el: HTMLInputElement) => el.value)) === dataFimBusca,
        };

        if (Object.values(formStatus).every(status => status)) {
            await page.click('button.btn-primary');
        } else {
            console.error('Erro ao preencher o formulário:', formStatus);
            return;
        }

        try {
            await page.waitForSelector('a[href*="exibenormativo"]', { timeout: 10000 });
        } catch (error) {
            console.error('Erro ao carregar resultados:', error);
            return;
        }

        const results = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href*="exibenormativo"]')).map(item => (item as HTMLAnchorElement).href);
        });

        // Salva os resultados no requestData
        (request.userData as CrawlData).results = results;

        // Criação de PDFs a partir dos links de normativos
        if (!existsSync('pdf_normas')) {
            mkdirSync('pdf_normas');
        }

        for (const link of results) {
            await page.goto(link);

            // Selecionar o conteúdo do elemento <exibenormativo>
            const content = await page.$eval('exibenormativo', (el: HTMLElement) => el.innerHTML);


            const normNumberMatch = link.match(/numero=(\d+)/);
            const normNumber = normNumberMatch ? normNumberMatch[1] : 'unknown';
            const pdfPath = join('pdf_normas', `norma_${normNumber}.pdf`);

            await page.setContent(content);
            await page.pdf({ path: pdfPath, format: 'A4' });
            console.log(`PDF salvo em: ${pdfPath}`);
        }
    }
});

const startCrawler = async (data: CrawlData) => {
    const requestData = [{
        url: 'https://www.bcb.gov.br/estabilidadefinanceira/buscanormas',
        userData: data
    }];

    await crawler.run(requestData);

    const resultsJson = JSON.stringify(requestData[0].userData.results);
    console.log(resultsJson);
    return requestData[0].userData.results;
};

export default startCrawler;
