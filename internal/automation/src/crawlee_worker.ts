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

        await page.goto('https://www.bcb.gov.br/estabilidadefinanceira/buscanormas');
        console.log('Página carregada');

        // Preencher os campos do formulário
        if (tipoDocumento) {
            await page.selectOption('#tipoDocumento', tipoDocumento);
            console.log(`Campo 'tipoDocumento' preenchido com: ${tipoDocumento}`);
        }
        if (numero) {
            await page.fill('#numero', numero);
            console.log(`Campo 'numero' preenchido com: ${numero}`);
        }
        if (conteudo) {
            await page.fill('#conteudo', conteudo);
            console.log(`Campo 'conteudo' preenchido com: ${conteudo}`);
        }
        if (dataInicioBusca) {
            await page.fill('#dataInicioBusca', dataInicioBusca);
            console.log(`Campo 'dataInicioBusca' preenchido com: ${dataInicioBusca}`);
        }
        if (dataFimBusca) {
            await page.fill('#dataFimBusca', dataFimBusca);
            console.log(`Campo 'dataFimBusca' preenchido com: ${dataFimBusca}`);
        }

        const formStatus = {
            tipoDocumento: (await page.$eval('#tipoDocumento', (el: HTMLSelectElement) => el.value)) === tipoDocumento,
            numero: (await page.$eval('#numero', (el: HTMLInputElement) => el.value)) === numero,
            conteudo: (await page.$eval('#conteudo', (el: HTMLInputElement) => el.value)) === conteudo,
            dataInicioBusca: (await page.$eval('#dataInicioBusca', (el: HTMLInputElement) => el.value)) === dataInicioBusca,
            dataFimBusca: (await page.$eval('#dataFimBusca', (el: HTMLInputElement) => el.value)) === dataFimBusca,
        };

        console.log('\n Status de preenchimento do formulário:', formStatus);

        if (Object.values(formStatus).every(status => status)) {
            await page.click('button.btn-primary');
        } else {
            console.error('Erro ao preencher o formulário:', formStatus);
            return;
        }

        try {
            await page.waitForSelector('a[href*="exibenormativo"]', { timeout: 10000 });
            console.log('Resultados da busca carregados');
        } catch (error) {
            console.error('Erro ao carregar resultados:', error);
            return;
        }

        const results = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href*="exibenormativo"]')).map(item => (item as HTMLAnchorElement).href);
        });
        console.log('Links coletados:', results);

        // Criar diretório para PDFs se não existir
        const pdfDir = path.resolve(__dirname, 'pdf_normas');
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
            console.log('Diretório pdf_normas criado');
        }

        for (const result of results) {
            await page.goto(result);
            console.log(`Navegando para o link: ${result}`);

            // Extrair o título e o conteúdo do texto
            await page.waitForSelector('h2.titulo-pagina.cormorant');
            const title = await page.$eval('h2.titulo-pagina.cormorant', (el: HTMLElement) => el.textContent?.trim() || 'Sem Título');
            const content = await page.$eval('div#conteudoTexto', (el: HTMLElement) => el.innerHTML);




            // HTML para logo e conteúdo
            const logoHtml = `<div style="text-align: center;">
                                <img src="https://www.bcb.gov.br/assets/svg/logo-bcb.svg" width="126" alt="Banco Central do Brasil">
                              </div>`;
            const fullContentHtml = `
                ${logoHtml}
                <h2 style="text-align: center;">${title}</h2>
                <div>${content}</div>
            `;

            const pdfName = `norma_${path.basename(result)}.pdf`;
            const savePath = path.join(pdfDir, pdfName);

            try {
                // Definir o conteúdo HTML completo na página e gerar o PDF
                await page.setContent(fullContentHtml);
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
        console.log('Resultados salvos em requestData');
    },
});

const startCrawler = async (data: CrawlData) => {
    console.log('Iniciando o crawler com os dados:', data);
    const requestData = [{
        url: 'https://www.bcb.gov.br/estabilidadefinanceira/buscanormas',
        userData: data
    }];

    await crawler.run(requestData);

    // Saída JSON limpa dos resultados
    const resultsJson = JSON.stringify(requestData[0].userData.results);
    console.log('Resultados JSON:', resultsJson); // Certifique-se de que este seja o único output final
    return requestData[0].userData.results;
};

export default startCrawler;
