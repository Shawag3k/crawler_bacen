import { chromium } from 'playwright';

(async () => {
  // Inicializando o navegador
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navegar para a página de resultados
  await page.goto('https://www.bcb.gov.br/estabilidadefinanceira/buscanormas?dataInicioBusca=20%2F08%2F2020&dataFimBusca=26%2F08%2F2020&tipoDocumento=Todos');

  console.log('Página inicial carregada.');

  let pageNumber = 1;
  let hasNextPage = true;

  // Loop para navegar pelas páginas
  while (hasNextPage) {
    console.log(`Processando a página ${pageNumber}`);

    // Coletar a URL da página atual
    const currentPageURL = page.url();
    console.log(`URL da página ${pageNumber}: ${currentPageURL}`);

    // Tentar encontrar o botão para a próxima página
    const nextButton = await page.$('nav a[rel="next"]');
    
    if (nextButton) {
      // Se o botão existe, clicar nele e esperar a nova página carregar
      await nextButton.click();
      await page.waitForTimeout(2000); // Esperar um pouco para garantir que a nova página foi carregada
      pageNumber++;
    } else {
      // Se não encontrar o botão, terminar o loop
      hasNextPage = false;
    }
  }

  console.log('Não há mais páginas a processar.');
  await browser.close();
})();
