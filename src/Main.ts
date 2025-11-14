import "reflect-metadata";
import dotenv from "dotenv";
import BotController from "./bot/controller/BotController";
import JobsController from "./jobs/JobsController";
import { container } from "tsyringe";
import { Database } from "./database/Database";
import Client from "./bot/Client";
import ParsingController from "./parser/controller/ParsingController";

export default class Main {
    protected botController: BotController;
    protected jobsController: JobsController;

    constructor() {
        dotenv.config();
        this.resolveDependencies();
    }

    protected resolveDependencies() {
        this.botController = container.resolve(BotController);
        console.log('RRR CONTR INIT');
        this.jobsController = new JobsController();
    }
}