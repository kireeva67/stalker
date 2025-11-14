import Client from "../Client";
import { ValidationError } from "../../error/ValidationError";
import { Message, TPollAnswer, TSizeOption } from "../Types";
import { BotTokenNotFound } from "../../error/BotTokenNotFoundError";
import { Database } from "../../database/Database";
import { TTableLinkData, TTablePollData, TTableUserData } from "../../database/TableTypes";
import ParsingController from "../../parser/controller/ParsingController";
import { container, singleton } from "tsyringe";

@singleton()
export default class BotController {
    private client: Client;
    private parsingController: ParsingController;
    private database: Database;
    // private token: string | undefined;

    constructor() {
        this.init();
    }

    private async init() {
        this.client = container.resolve(Client);
        this.database = container.resolve(Database);
        this.parsingController = container.resolve(ParsingController);
        console.log('RRR CLIENT INIT', this);
        // console.log("ALLL USERS", await this.database.getAllUsers());
        // console.log("ALLL POLLS", await this.database.getAllPolls());
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
                chat_id: msg.chat.id
            }
            await this.database.addLink(data, msg.from.id);
        }
    }

    private async addPoll(msg: Message, pollId: string, options: string[], url: string) {
        if (msg.from) {
            const data: TTablePollData = {
                poll_id: pollId,
                chat_id: msg.chat.id,
                options,
                url,
            }
            await this.database.addPoll(data, msg.from.id);
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
            const response = await this.getResponse(text, chatId);
            if (response) {
                this.client.sendApproveMessage(chatId);
                this.proceedPolls(chatId, msg, text);
            }
        } else {
            if (msg.text === '/start') {
                this.onStart(msg);
            } else {
                this.client.sendNoLinkMessage(chatId);
            }
        }
    }

    private async proceedPolls(chatId: number, msg: Message, text: string) {
        const sizeNames = this.parsingController.getSizesNames();
        const sizeOptions = this.splitOptionsIntoPolls(sizeNames);
        console.log("SIZE OPTIONSS", sizeOptions);
        const sizeMap = this.parsingController.getAllSizesMap();
        await Promise.all(sizeOptions.map(async (options) => {
            console.log(options);
            const poll = await this.client.sendPoll(chatId, options);
            if (poll.poll) {
                options.forEach(size => {
                    sizeMap.map((option: { size: string; }, id: number) => {
                        if (option.size === size) {
                            sizeMap[id].pollId = poll.poll?.id;
                        }
                    });
                });
                this.addPoll(msg, poll.poll.id, options, text);
            }
        }));
        this.addLink(msg, sizeMap);
    }

    protected async getResponse(link: string, chatId: number) {
        const parser = this.parsingController.setUpParser(link);
        if (!parser) {
            this.client.sendNotValidParser(chatId);
        }
        try {
            return await this.parsingController.parse(link);
        } catch (error) {
            if (error instanceof ValidationError) {
                this.client.sendNotValidMessage(chatId);
                console.log(error.name, error.message);
            }
        }
    }

    public async parseLink(link: string, chatId: number) {
        console.log('RRRR THIS', this);
        
        const parser = this.parsingController.setUpParser(link);
        if (!parser) {
            this.client.sendNotValidParser(chatId);
        }
        try {
            return await this.parsingController.parse(link);
        } catch (error) {
            console.log(error);
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
        const poll: { id: number; poll_id: string; chat_id: number; user_id: number; options: any; url: string } | null = await this.database.getPoll(pollAnswer.user.id, pollAnswer.poll_id);//.find(el => el.poll?.id === pollAnswer.poll_id);
        console.log("POLLLL ANSW", poll, pollAnswer);
        
        if (poll) {
            const pollOptions: string[] = poll.options;
            const choosenOptionIds = pollAnswer.option_ids;
            const willNotStalkering: string[] = [];
            const willAdd: string[] = [];
            console.log("CHOSENNN", poll,  choosenOptionIds[0]);
            const response = await this.getResponse(poll.url, poll.chat_id);
            if (response) {
                const sizesMap = this.parsingController.getAllSizesMap();
                await Promise.all(choosenOptionIds.map(async id => {
                    const choosenSize = pollOptions[id];
                    const size = sizesMap.find((option: { size: string; }) => option.size === choosenSize);
                    console.log("WTFFF", id, choosenSize, size);
                    if (size && size.available) {
                        willNotStalkering.push(choosenSize);
                    } else {
                        willAdd.push(choosenSize);
                        this.client.sendItemAddedToStalkerList(poll.chat_id, choosenSize);
                    }
                }));
                if (willNotStalkering.length) {
                    this.client.sendItemAvailable(poll.chat_id, willNotStalkering);
                }
                await this.database.addChoosenOptions(poll.poll_id, pollAnswer.user.id, poll.url, willAdd);
            }
        }
        console.log('pollAnswerrrr', pollAnswer);
    }
}