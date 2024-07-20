import { PlaywrightCrawler } from 'crawlee';

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

        // Preencher os campos do formulário
        if (tipoDocumento) await page.selectOption('#tipoDocumento', tipoDocumento);
        if (numero) await page.fill('#numero', numero);
        if (conteudo) await page.fill('#conteudo', conteudo);
        if (dataInicioBusca) await page.fill('#dataInicioBusca', dataInicioBusca);
        if (dataFimBusca) await page.fill('#dataFimBusca', dataFimBusca);

        // Verificar se os campos foram preenchidos corretamente
        const tipoDocumentoValue = await page.$eval('#tipoDocumento', (el: HTMLSelectElement) => el.value);
        const numeroValue = await page.$eval('#numero', (el: HTMLInputElement) => el.value);
        const conteudoValue = await page.$eval('#conteudo', (el: HTMLInputElement) => el.value);
        const dataInicioBuscaValue = await page.$eval('#dataInicioBusca', (el: HTMLInputElement) => el.value);
        const dataFimBuscaValue = await page.$eval('#dataFimBusca', (el: HTMLInputElement) => el.value);

        const formStatus = {
            tipoDocumento: tipoDocumentoValue === tipoDocumento,
            numero: numeroValue === numero,
            conteudo: conteudoValue === conteudo,
            dataInicioBusca: dataInicioBuscaValue === dataInicioBusca,
            dataFimBusca: dataFimBuscaValue === dataFimBusca,
        };

        console.log('Form Status:', formStatus);

        // Submeter o formulário se todos os campos estiverem corretos
        if (Object.values(formStatus).every(status => status)) {
            await page.click('button.btn-primary');
        } else {
            console.error('Form filling error:', formStatus);
        }

        // Esperar os resultados carregarem
        await page.waitForSelector('a[href*="exibenormativo"]');

        // Coletar os resultados
        const results = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href*="exibenormativo"]')).map(item => (item as HTMLAnchorElement).href);
        });

        console.log(results);

        // Adicionar resultados aos dados do usuário para retornar ao índice
        (request.userData as CrawlData).results = results;  
    },
});

const startCrawler = async (data: CrawlData) => {
    const requestData = [{
        url: 'https://www.bcb.gov.br/estabilidadefinanceira/buscanormas',
        userData: data 
    }];

    await crawler.run(requestData);

    return requestData[0].userData.results;  // Retornar resultados
};

export default startCrawler;
