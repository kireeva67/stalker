import dotenv from "dotenv";
import BotController from "./bot/controller/BotController";

export default class Main {
    protected botController: BotController;

    constructor() {
        dotenv.config();
        this.resolveDependencies();
    }

    protected resolveDependencies() {
        this.botController = new BotController();
    }
}