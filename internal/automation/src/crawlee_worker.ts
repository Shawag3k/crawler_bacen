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
    requestHandlerTimeoutSecs: 180,  // Timeout aumentado para 3 minutos
    requestHandler: async ({ page, request, log }) => {
        const { tipoDocumento, numero, conteudo, dataInicioBusca, dataFimBusca } = request.userData as CrawlData;

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

        while (hasNextPage) {
            log.info(`Processando a página ${pageIndex}`);
            
            // Aguardar a página carregar e coletar os links
            await page.waitForSelector('a[href*="exibenormativo"]', { timeout: 15000 });
            const pageResults: string[] = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a[href*="exibenormativo"]')).map(item => (item as HTMLAnchorElement).href);
            });

            log.info(`Links coletados na página ${pageIndex}:`, pageResults);

            // Gerar PDFs dos links coletados
            await generatePDFsFromLinks(page, pageResults);

            // Tentar navegar para a próxima página, se disponível
            hasNextPage = await page.evaluate(() => {
                const nextPageButton = document.querySelector('a.page-link[aria-label="Próxima"]');
                if (nextPageButton && !nextPageButton.closest('li.page-item.disabled')) {
                    (nextPageButton as HTMLAnchorElement).click();
                    return true;
                }
                return false;
            });

            if (hasNextPage) {
                pageIndex++;
                log.info(`Navegando para a página ${pageIndex}`);
                await page.waitForTimeout(5000); // Pausa para garantir que a página carregue
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
            } else {
                log.info('Nenhuma página adicional encontrada ou fim dos resultados alcançado.');
            }
        }
    },
});

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
                await page.waitForSelector('div.WordSection1');
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
}

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
