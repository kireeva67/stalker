import Bot from 'node-telegram-bot-api';
import EventEmitter from "events";
import { Message, TPollAnswer } from './Types';

export default class Client extends EventEmitter {
    private bot;
    private maxOptions = 10;
    private minOptions = 2;

    constructor(token: string) {
        super();
        this.bot = new Bot(token, {polling: true});
        this.attachListeners(); 
    }

    private async onStart(message: Message) {
        this.emit('onStart', message);
    }

    private attachListeners() {
        this.bot.onText(/\/start/, this.onStart.bind(this));
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