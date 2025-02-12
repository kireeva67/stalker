import Client from "../Client";
import { ValidationError } from "../../error/ValidationError";
import { Message, TPollAnswer, TSizeOption } from "../Types";
import { BotTokenNotFound } from "../../error/BotTokenNotFoundError";
import { Database } from "../../database/Database";
import { TTableLinkData, TTableUserData } from "../../database/TableTypes";
import AbstractParser from "../../parser/AbstractParser";
import ParsingController from "../../parser/controller/ParsingController";

export default class BotController {
    private client: Client;
    private parsingController: AbstractParser;
    private database: Database;
    private token: string | undefined;
    private polls: Message[] = [];

    constructor() {
        this.init();
    }

    private async init() {
        this.token = process.env.TELEGRAM_BOT_TOKEN;    
        if (!this.token) {
            throw BotTokenNotFound;
        }
        this.client = new Client(this.token);
        this.database = new Database();
        console.log("ALLL USERS", await this.database.getAllUsers());
        this.attachListeners(); 
    }

    private attachListeners() {
        this.client.on('messageReceived', this.onMessageReceived.bind(this));
        this.client.on('pollVoted', this.onPollVoted.bind(this));
    }

    private async onStart(msg: Message) {
        const firstName = msg?.from?.first_name ?? "";
        this.client.sendStartMessage(msg.chat.id, firstName);
    }

    private async addUser(msg: Message) {
        if (msg.from) {
            const data: TTableUserData = {
                telegram_id: msg.from.id,
                username: msg.from.username || "",
                first_name: msg.from.first_name || "",
                last_name: msg.from.last_name || "",
                is_bot: msg.from.is_bot
            }
            await this.database.addUser(data);
        }
    }

    private async addLink(msg: Message, sizeMap: TSizeOption[]) {
        if (msg.from && msg.text) {
            const data: TTableLinkData = {
                url: msg.text,
                available_params: sizeMap,
            }
            await this.database.addLink(data, msg.from.id);
        }
    }

    private async onMessageReceived(msg: Message) {
        console.log('MSGGG', msg);
        await this.addUser(msg);
        const chatId = msg.chat.id;
        const text = msg.text || '';
        const linksExpressions = ['http://', 'https://'];
        const isItLink = linksExpressions.map(expr => text.includes(expr)).filter(check => check).length > 0;
        if (isItLink) {
            const parsingController = new ParsingController();
            const link = text;
            const parser = parsingController.setUpParser(link);
            if (!parser) {
                this.client.sendNotValidParser(chatId);
            }
            this.parsingController = parser;
            let response;
            try {
                response = await parsingController.parse(link);
            } catch (error) {
                if (error instanceof ValidationError) {
                    this.client.sendNotValidMessage(chatId);
                    console.log(error.name, error.message);
                }
            }
            if (response) {
                this.client.sendApproveMessage(chatId);
                // const colorNames = parsingController.getColorNames();
                // const colorOptions = this.splitOptionsIntoPolls(colorNames);
                // colorOptions.map(option => {
                //     console.log(option);
                //     this.client.sendPoll(chatId, option);
                // });
                const sizeNames = parsingController.getSizesNames();
                
                const sizeOptions = this.splitOptionsIntoPolls(sizeNames);
                console.log("SIZE OPTIONSS", sizeOptions);
                
                const sizeMap = parsingController.getAllSizesMap();
                await Promise.all(sizeOptions.map(async (options) => {
                    console.log(options);
                    const poll = await this.client.sendPoll(chatId, options);
                    options.forEach(size => {
                        sizeMap.map((option: { size: string; }, id: number) => {
                            if (option.size === size) {
                                sizeMap[id].pollId = poll.poll?.id;
                            }
                        });
                    });
                    this.polls.push(poll);
                }));
                
                console.log("TTTTT", sizeMap);
                
                this.addLink(msg, sizeMap);
            }
        } else {
            if (msg.text === '/start') {
                this.onStart(msg);
            } else {
                this.client.sendNoLinkMessage(chatId);
            }
        }
    }

    private splitOptionsIntoPolls(options: string[]) {
        const max = this.client.getMaxOptions();
        const min = this.client.getMinOptions();
        const polls = [];
        for (let i = 0; i < options.length; i += max) {
          polls.push(options.slice(i, i + max));
        }
        polls.map(poll => {
            if (poll.length < min) {
                poll.push("you get this option because you are lucky.");
            }
        })
        return polls;
    }

    private async onPollVoted(pollAnswer: TPollAnswer) {
        const poll = this.polls.find(el => el.poll?.id === pollAnswer.poll_id);
        console.log("POLLLL ANSW", poll, this.polls, pollAnswer.poll_id);
        
        if (poll) {
            const pollOptions = poll.poll?.options ?? [];
            const choosenOptionIds = pollAnswer.option_ids;
            const willNotStalkering: string[] = [];
            console.log("POLLLL ANSW", poll);
            
            choosenOptionIds.forEach(id => {
                const sizesMap = this.parsingController.getAllSizesMap();
                const choosenSize = pollOptions[id].text;
                const size = sizesMap.find((option: { size: string; }) => option.size === choosenSize);
                if (size && size.available) {
                    willNotStalkering.push(choosenSize);
                } else {
                    // this.database.addChoosenOption(pollAnswer.user.id, poll.chat.id, choosenSize);
                    this.client.sendItemAddedToStalkerList(poll.chat.id, choosenSize);
                }
            });
            if (willNotStalkering.length) {
                this.client.sendItemAvailable(poll.chat.id, willNotStalkering);
            }
        }
        console.log('pollAnswerrrr', pollAnswer);
    }
}