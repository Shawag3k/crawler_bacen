import { chromium } from 'playwright';

(async () => {
  // Inicializando o navegador
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navegar para a página de resultados
  await page.goto('https://www.bcb.gov.br/estabilidadefinanceira/buscanormas?dataInicioBusca=20%2F08%2F2020&dataFimBusca=26%2F08%2F2020&tipoDocumento=Todos');

  console.log('Página inicial carregada. Aguardando 5 segundos...');

  // Aguardar 5 segundos para a primeira página carregar completamente
  await page.waitForTimeout(5000);

  let pageNumber = 1;
  let hasNextPage = true;

  // Função para aguardar o carregamento completo da página
  async function waitForPageLoad() {
    console.log('Aguardando seletor da paginação para garantir que a página foi carregada...');
    // Aguardar até que um seletor que só existe após o carregamento apareça (por exemplo, um resultado da busca)
    await page.waitForSelector('ul.pagination', { timeout: 5000 });
    console.log('Seletor da paginação encontrado. Página carregada.');
    // Esperar 5 segundos após o carregamento da página
    await page.waitForTimeout(5000);
  }

  // Loop para navegar pelas páginas
  while (hasNextPage) {
    console.log(`Processando a página ${pageNumber}`);

    // Coletar a URL da página atual
    const currentPageURL = page.url();
    console.log(`URL da página ${pageNumber}: ${currentPageURL}`);

    // Verificar se há links de paginação disponíveis
    const paginationLinks = await page.$$('ul.pagination a.page-link');
    console.log(`Encontrados ${paginationLinks.length} links de navegação na página ${pageNumber}.`);

    if (paginationLinks.length > 0) {
      console.log('Links de paginação encontrados. Verificando o link para a próxima página...');

      // Tentar encontrar o botão com o aria-label="Próxima"
      const nextButton = await page.$('a[aria-label="Próxima"]');

      if (nextButton) {
        console.log(`Botão de próxima página encontrado na página ${pageNumber}. Clicando...`);
        // Se o botão existe, clicar nele e esperar a nova página carregar
        await nextButton.click();

        // Adicionar log antes de aguardar o carregamento da nova página
        console.log(`Clicado no botão "Próxima" na página ${pageNumber}. Aguardando o carregamento da próxima página...`);
        
        // Esperar que a nova página seja carregada com o temporizador de 5 segundos
        await waitForPageLoad();

        // Incrementar o número da página e log
        pageNumber++;
        console.log(`Página avançada para ${pageNumber}`);
      } else {
        console.log(`Botão de próxima página não encontrado na página ${pageNumber}.`);
        hasNextPage = false;
      }
    } else {
      console.log(`Nenhum link de paginação encontrado na página ${pageNumber}.`);
      hasNextPage = false;
    }
  }

  console.log('Não há mais páginas a processar.');
  await browser.close();
})();
