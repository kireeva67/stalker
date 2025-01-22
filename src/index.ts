import dotenv from "dotenv";
import BotController from "./bot/controller/BotController";
dotenv.config();
console.log("Hello, TypeScript in Node.js!");

new BotController();