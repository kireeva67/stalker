import dotenv from "dotenv";
import BotController from "./bot/controller/BotController";
import { Database } from "./database/Database";

export default class Main {
    protected botController: BotController;
    protected database: Database;

    constructor() {
        dotenv.config();
        this.resolveDependencies();
    }

    protected resolveDependencies() {
        this.database = new Database();
        this.botController = new BotController();
    }
}