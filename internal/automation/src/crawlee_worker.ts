import { PlaywrightCrawler } from 'crawlee';
import { Page } from 'playwright';
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
    requestHandlerTimeoutSecs: 5400,  
    requestHandler: async ({ page, request, log }) => {
        const { tipoDocumento, numero, conteudo, dataInicioBusca, dataFimBusca } = request.userData as CrawlData;

        // Navegar para a página de busca de normas
        await page.goto('https://www.bcb.gov.br/estabilidadefinanceira/buscanormas');
        console.log('Página de busca de normas carregada');

        // Preencher os campos do formulário
        if (tipoDocumento) await page.selectOption('#tipoDocumento', tipoDocumento);
        if (numero) await page.fill('#numero', numero);
        if (conteudo) await page.fill('#conteudo', conteudo);
        if (dataInicioBusca) await page.fill('#dataInicioBusca', dataInicioBusca);
        if (dataFimBusca) await page.fill('#dataFimBusca', dataFimBusca);

        // Enviar o formulário
        await page.click('button.btn-primary');
        log.info('Formulário enviado com sucesso');

        let pageIndex = 1;
        let hasNextPage = true;
        const allPageLinks: string[] = [];  // Coletar links de todas as páginas

        // Função para aguardar o carregamento completo da página
        async function waitForPageLoad() {
            await page.waitForSelector('ul.pagination', { timeout: 5000 });
            console.log('Página carregada. Aguardando 5 segundos...');
            await page.waitForTimeout(5000);
        }

        // Função para verificar se estamos na página de resultados
        async function isOnResultsPage(): Promise<boolean> {
            const currentUrl = page.url();
            return currentUrl.includes('buscanormas');
        }

        // Loop para navegar pelas páginas e coletar os links
        while (hasNextPage) {
            log.info(`Processando a página ${pageIndex}`);

            // Verificar se estamos na página de resultados
            if (!(await isOnResultsPage())) {
                console.log('Não estamos na página de resultados, retornando...');
                await page.goBack();
                await waitForPageLoad();
            }

            // Coletar os links da página de resultados
            await page.waitForSelector('a[href*="exibenormativo"]', { timeout: 15000 });
            const pageResults: string[] = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a[href*="exibenormativo"]')).map(item => (item as HTMLAnchorElement).href);
            });

            allPageLinks.push(...pageResults);  // Adiciona os links da página atual à lista geral
            log.info(`Links coletados na página ${pageIndex}:`, pageResults);

            // Verificar a presença do botão "Próxima"
            hasNextPage = await page.evaluate(() => {
                const nextPageButton = document.querySelector('a.page-link[aria-label="Próxima"]');
                return !!(nextPageButton && !nextPageButton.closest('li.page-item.disabled'));
            });

            if (hasNextPage) {
                log.info(`Navegando para a próxima página (${pageIndex + 1})`);
                await page.evaluate(() => {
                    const nextPageButton = document.querySelector('a.page-link[aria-label="Próxima"]') as HTMLElement;
                    nextPageButton.click();
                });

                await waitForPageLoad();  // Esperar o carregamento da nova página
                pageIndex++;
            } else {
                log.info('Nenhuma página adicional encontrada ou fim dos resultados alcançado.');
            }
        }

        // Após coletar todos os links, gerar os PDFs
        await generatePDFsFromLinks(page, allPageLinks);
    },
});

// Função para gerar PDFs dos links coletados
async function generatePDFsFromLinks(page: Page, links: string[]) {
    const pdfDir = path.resolve(__dirname, 'pdf_normas');
    if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
        console.log('Diretório pdf_normas criado');
    }

    for (const link of links) {
        try {
            await page.goto(link);
            console.log(`Navegando para o link: ${link}`);

            await page.waitForTimeout(4000);

            const title = await page.$eval('h2.titulo-pagina.cormorant', (el: HTMLElement) => el.textContent?.trim() || 'Sem Título');

            let content;
            try {
                content = await page.$eval('div#conteudoTexto', (el: HTMLElement) => el.innerHTML);
            } catch {
                // Reduzindo o timeout para 10 segundos
                await page.waitForSelector('div.WordSection1', { timeout: 10000 });
                content = await page.$eval('div.WordSection1', (el: HTMLElement) => el.innerHTML);
            }

            const logoHtml = `<div style="text-align: center;">
                                <img src="https://www.bcb.gov.br/assets/svg/logo-bcb.svg" width="126" alt="Banco Central do Brasil">
                              </div>`;
            const fullContentHtml = `
                ${logoHtml}
                <h2 style="text-align: center;">${title}</h2>
                <div>${content}</div>
            `;

            const pdfName = `norma_${path.basename(link)}.pdf`;
            const savePath = path.join(pdfDir, pdfName);

            try {
                await page.setContent(fullContentHtml);
                await page.pdf({ path: savePath, format: 'A4' });
                console.log(`PDF salvo em: ${savePath}`);
            } catch (error) {
                console.error(`Erro ao salvar PDF em ${savePath}:`, error);
            }
        } catch (error) {
            console.error(`Erro ao processar o link ${link}:`, error);
        }
    }

    console.log('Todos os PDFs foram gerados. Encerrando o processo.');
}

// Função principal para iniciar o crawler
const startCrawler = async (data: CrawlData) => {
    console.log('Iniciando o crawler com os dados:', data);
    const requestData = [{
        url: 'https://www.bcb.gov.br/estabilidadefinanceira/buscanormas',
        userData: data
    }];

    await crawler.run(requestData);

    const resultsJson = JSON.stringify(requestData[0].userData.results);
    console.log('Resultados JSON:', resultsJson);
    return requestData[0].userData.results;
};

export default startCrawler;
