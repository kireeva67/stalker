import "reflect-metadata";
import dotenv from "dotenv";
import BotController from "./bot/controller/BotController";
import JobsController from "./jobs/JobsController";
import { container } from "tsyringe";

export default class Main {
    protected botController: BotController;
    protected jobsController: JobsController;

    constructor() {
        dotenv.config();
        this.resolveDependencies();
    }

    protected resolveDependencies() {
        this.botController = container.resolve(BotController);
        this.jobsController = new JobsController();
    }
}