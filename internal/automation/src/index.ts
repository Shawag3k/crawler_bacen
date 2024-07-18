import express, { Request, Response } from 'express';
import startCrawler from './crawlee_worker';

const app = express();
const port = 3000;

app.get('/start_crawl', async (req: Request, res: Response) => {
    try {
        await startCrawler({
            tipoDocumento: "algumTipo",  // substitua com os parâmetros reais
            numero: "123",
            conteudo: "algumConteudo",
            dataInicioBusca: "2022-01-01",
            dataFimBusca: "2022-12-31"
        });
        res.status(200).send('Crawling started successfully!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error starting the crawling process');
    }
});

app.listen(port, () => {
    console.log(`TypeScript crawler listening at http://localhost:${port}`);
});
