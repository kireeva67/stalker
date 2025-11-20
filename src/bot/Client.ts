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
        this.token = process.env.TELEGRAM_BOT_TOKEN;
        if (!this.token) {
            throw BotTokenNotFound;
        }
        if (!this.bot) {
            const shouldPoll = isMainThread;
            this.bot = new Bot(this.token, { polling: shouldPoll });
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

    public async sendApproveMessage(chatId: number) {
        try {
            await this.bot.sendMessage(chatId, `It looks like you sent a link.`);
            console.log(`[Client] sendApproveMessage: message sent to ${chatId}`);
        } catch (err) {
            console.error('[Client] sendApproveMessage error:', err);
        }
    }

    public sendNoLinkMessage(chatId: number) {
        this.bot.sendMessage(chatId, `No link detected in your message.`);
    }

    public sendNotValidParser(chatId: number) {
        this.bot.sendMessage(chatId, `I will not stalkering this.`);
    }

    public async sendItemAvailable(chatId: number, sizes: string[]) {
        try {
            await this.bot.sendMessage(chatId, `I will not stalkering ${sizes} - target in sight. Warning! If you see this item as una`);
            console.log(`[Client] sendItemAvailable: message sent to ${chatId}`);
        } catch (err) {
            console.error('[Client] sendItemAvailable error:', err);
        }
    }

    public async sendNewItemAvailable(chatId: number, sizes: string[], url: string) {
        try {
            await this.bot.sendMessage(chatId, `Your target ${sizes} in sight. Hurry up!${url}`);
            console.log(`[Client] sendNewItemAvailable: message sent to ${chatId}`);
        } catch (err) {
            console.error('[Client] sendNewItemAvailable error:', err);
        }
    }

    public async sendDeactivateLink(chatId: number, url: string) {
        try {
            await this.bot.sendMessage(chatId, `All targets found. Link stalkering was deactivated ${url}`);
            console.log(`[Client] sendDeactivateLink: message sent to ${chatId}`);
        } catch (err) {
            console.error('[Client] sendDeactivateLink error:', err);
        }
    }

    public async sendItemAddedToStalkerList(chatId: number, size: string) {
        try {
            await this.bot.sendMessage(chatId, `Size ${size} was added to stalker list.`);
            console.log(`[Client] sendItemAddedToStalkerList: message sent to ${chatId}`);
        } catch (err) {
            console.error('[Client] sendItemAddedToStalkerList error:', err);
        }
    }

    public getMaxOptions() {
        return this.maxOptions;
    }

    public getMinOptions() {
        return this.minOptions;
    }
}