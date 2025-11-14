import "reflect-metadata"; 
import { container } from "tsyringe";
import { Database } from "../database/Database";
import ParsingController from "../parser/controller/ParsingController";
import Client from "../bot/Client";
import { isMainThread, parentPort } from 'worker_threads';

console.log('checkActiveLinks.ts file loaded');

async function checkActiveLinks() {
    console.log('checkActiveLinks function called!');

    try {
        const parsingController = container.resolve(ParsingController);
        const database = container.resolve(Database);
        const client = container.resolve(Client);

        const linksToCheck = await database.getLinksToCheck();
        console.log('Links to check:', linksToCheck.length);
        
        if (linksToCheck.length === 0) {
            console.log('No links to check');
            return;
        }
        
        const chunks = splitToChunks(linksToCheck, 5);
        await Promise.all(chunks.map(async chunk => {
            await Promise.all(chunk.map(async link => {
                try {
                    const parser = parsingController.setUpParser(link.url);
                    if (!parser) {
                        client.sendNotValidParser(link.chat_id);
                        return;
                    }
                    
                    const response = await parsingController.parse(link.url);
                    console.log('RESPONSE for', link.url);
                
                    
                } catch (error) {
                    console.error(`Error parsing link ${link.url}:`, error);
                }
            }));
        }));

        parentPort?.postMessage('done');
    } catch (error) {
        console.error("Error in Bree Job:", error);
        throw error; 
    }
}

function splitToChunks(array: any[], chunkSize: number = 1) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};

export default checkActiveLinks;

if (!isMainThread) {
    console.log('Running in worker thread, executing checkActiveLinks...');
    checkActiveLinks().catch(error => {
        console.error('Fatal error in checkActiveLinks:', error);
        process.exit(1);
    });
}