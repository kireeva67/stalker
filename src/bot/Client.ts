import Bot from 'node-telegram-bot-api';
import EventEmitter from "events";
import { Message, TPollAnswer } from './Types';
import { singleton } from 'tsyringe';
import { BotTokenNotFound } from '../error/BotTokenNotFoundError';
import { isMainThread } from 'worker_threads';

@singleton()
export default class Client extends EventEmitter {
    protected token: string | undefined;;
    public bot;
    private maxOptions = 10;
    private minOptions = 2;

    constructor() {
        super();
        console.log('RRR BOT INIT', this.bot);
        this.token = process.env.TELEGRAM_BOT_TOKEN;    
        if (!this.token) {
            throw BotTokenNotFound;
        }
        if (!this.bot) {
            const shouldPoll = isMainThread;
            this.bot = new Bot(this.token, {polling: shouldPoll});
            if (shouldPoll) {
                this.attachListeners(); 
            }
        }
    }

    private attachListeners() {
        this.bot.on('message', this.onMessage.bind(this));
        this.bot.on('poll_answer', this.onPollAnswer.bind(this));
    }

    private async onPollAnswer(pollAnswer: TPollAnswer) {
        this.emit('pollVoted', pollAnswer);
    }

    private async onMessage(message: Message) {
        console.log('rererer', message);
        this.emit('messageReceived', message);
    }

    public async sendPoll(chatId: number, options: string[]) {
        return this.bot.sendPoll(chatId, 'Choose size or sizes to stalk:', 
        options, {
        is_anonymous: false,
        allows_multiple_answers: true
        });
    }

    public sendStartMessage(chatId: number, name: string) {
        this.bot.sendMessage(chatId, `Welcome, ${name}! Provide a link for item you want to stalk for`);
    }

    public sendNotValidMessage(chatId: number) {
        this.bot.sendMessage(chatId, `Sorry! Your link is not valid.`);
    }

    public sendApproveMessage(chatId: number) {
        this.bot.sendMessage(chatId, `It looks like you sent a link.`);
    }

    public sendNoLinkMessage(chatId: number) {
        this.bot.sendMessage(chatId, `No link detected in your message.`);
    }

    public sendNotValidParser(chatId: number) {
        this.bot.sendMessage(chatId, `I will not stalkering this.`);
    }

    public sendItemAvailable(chatId: number, sizes: string[]) {
        this.bot.sendMessage(chatId, `I will not stalkering ${sizes} - target in sight.`);
    }

    public sendItemAddedToStalkerList(chatId: number, size: string) {
        this.bot.sendMessage(chatId, `Size ${size} was added to stalker list.`);
    }

    public getMaxOptions() {
        return this.maxOptions;
    }

    public getMinOptions() {
        return this.minOptions;
    }
}