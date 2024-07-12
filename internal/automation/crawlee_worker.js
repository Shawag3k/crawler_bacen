import { PlaywrightCrawler } from 'crawlee';

const crawler = new PlaywrightCrawler({
    requestHandler: async ({ page, request }) => {
        const { tipoDocumento, numero, conteudo, dataInicioBusca, dataFimBusca } = request.userData;

        // Navegar até a página com o formulário
        await page.goto('URL_DO_FORMULARIO_DO_BCB');

        // Preencher os campos do formulário
        if (tipoDocumento) await page.selectOption('#tipoDocumento', tipoDocumento);
        if (numero) await page.fill('#numero', numero);
        if (conteudo) await page.fill('#conteudo', conteudo);
        if (dataInicioBusca) await page.fill('#dataInicioBusca', dataInicioBusca);
        if (dataFimBusca) await page.fill('#dataFimBusca', dataFimBusca);

        // Verificar se os campos foram preenchidos corretamente
        const tipoDocumentoValue = await page.$eval('#tipoDocumento', el => el.value);
        const numeroValue = await page.$eval('#numero', el => el.value);
        const conteudoValue = await page.$eval('#conteudo', el => el.value);
        const dataInicioBuscaValue = await page.$eval('#dataInicioBusca', el => el.value);
        const dataFimBuscaValue = await page.$eval('#dataFimBusca', el => el.value);

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

        // Coletar os resultados (se o formulário foi submetido corretamente)
        const results = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.result-item')).map(item => item.href);
        });

        console.log(results);
    },
});

const startCrawler = async (data) => {
    await crawler.run([{
        url: 'URL_DO_FORMULARIO_DO_BCB',
        userData: data 
    }]);
};

export default startCrawler;
