import { PlaywrightCrawler } from 'crawlee';
import fs from 'fs';
import path from 'path';

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

        // Criar diretório para PDFs se não existir
        const pdfDir = path.resolve(__dirname, 'pdf_normas');
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        for (const result of results) {
            await page.goto(result);
            const content = await page.$eval('exibenormativo', (el: HTMLElement) => el.innerHTML);
            const pdfName = `norma_${path.basename(result)}.pdf`;
            const savePath = path.join(pdfDir, pdfName);

            try {
                await page.pdf({ path: savePath, format: 'A4' });
                console.log(`PDF salvo em: ${savePath}`);

                // Verifica se o arquivo foi realmente criado
                if (fs.existsSync(savePath)) {
                    console.log(`Confirmação: PDF salvo com sucesso em ${savePath}`);
                } else {
                    console.error(`Erro: PDF não encontrado após tentativa de salvamento em ${savePath}`);
                }
            } catch (error) {
                console.error(`Erro ao salvar PDF em ${savePath}:`, error);
            }
        }

        // Salva os resultados no requestData
        (request.userData as CrawlData).results = results;
    },
});

const startCrawler = async (data: CrawlData) => {
    const requestData = [{
        url: 'https://www.bcb.gov.br/estabilidadefinanceira/buscanormas',
        userData: data
    }];

    await crawler.run(requestData);

    // Saída JSON limpa dos resultados
    const resultsJson = JSON.stringify(requestData[0].userData.results);
    console.log(resultsJson); // Certifique-se de que este seja o único output final
    return requestData[0].userData.results;
};

export default startCrawler;
