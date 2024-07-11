import { startFormFilling } from './formFiller';
import { startLinkCollection } from './linkCollector';
import { startPDFDownload } from './pdfDownloader';

const runCrawler = async () => {
    console.log('Starting the crawler...');
    await startFormFilling();
    const links = await startLinkCollection();
    await startPDFDownload(links);
    console.log('Crawler finished.');
};

runCrawler().catch(console.error);
