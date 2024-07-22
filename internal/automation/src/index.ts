import express, { Request, Response } from 'express';
import startCrawler from './crawlee_worker';

const app = express();
const port = 3000;

app.use(express.json());

app.post('/start-crawl', async (req: Request, res: Response) => {
    try {
        const { tipoDocumento, numero, conteudo, dataInicioBusca, dataFimBusca } = req.body;
        const results = await startCrawler({
            tipoDocumento,
            numero,
            conteudo,
            dataInicioBusca,
            dataFimBusca
        });
        res.status(200).json({ links: results });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error starting the crawling process');
    }
});

app.listen(port, () => {
    console.log(`TypeScript crawler listening at http://localhost:${port}`);
});

