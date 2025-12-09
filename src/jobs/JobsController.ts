import * as path from 'node:path';
import Bree from 'bree';
import { SHARE_ENV } from 'node:worker_threads';


export default class JobsController {
  protected bree: Bree;

  constructor() {
    this.init();
    this.attachListeners();
    this.start();
  }

  protected async init() {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    this.bree = new Bree({
      root: path.join(__dirname, '../jobs'),
      defaultExtension: isDevelopment ? 'ts' : 'js',
      acceptedExtensions: ['.ts', '.js'],
      jobs: [
        {
          name: 'checkActiveLinks',
          interval: '30s',
          timeout: 0,
          closeWorkerAfterMs: 5000,
          worker: {
            env: SHARE_ENV,
          },
        }
      ]
    });
  }

  protected async start() {
    console.log('Starting Bree...');
    await this.bree.start("checkActiveLinks");
    console.log('Bree started');
  }

  protected attachListeners() {
    this.bree.on('worker created', (name) => {
      console.log(`Worker for job "${name}" created`);
    });

    this.bree.on('worker deleted', (name) => {
      console.log(`Worker for job "${name}" deleted`);
    });

    this.bree.on('error', (error, name) => {
      console.error(`Error in job "${name}":`, error);
    });
  }

}