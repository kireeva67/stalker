import Client from "../Client";
import { ValidationError } from "../../error/ValidationError";
import { Message, TPollAnswer, TSizeOption } from "../Types";
import { Database } from "../../database/Database";
import { TTableLinkData, TTablePollData, TTableUserData } from "../../database/TableTypes";
import ParsingController from "../../parser/controller/ParsingController";
import { container, singleton } from "tsyringe";
import { log } from "node:console";

@singleton()
export default class BotController {
    private client: Client;
    private parsingController: ParsingController;
    private database: Database;

    constructor() {
        this.init();
    }

    private async init() {
        this.client = container.resolve(Client);
        this.database = container.resolve(Database);
        this.parsingController = container.resolve(ParsingController);
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
                chat_id: msg.chat.id,
                user_id: msg.from.id
            }
            await this.database.addLink(data, msg.from.id);
            console.log("LINK ADDEDDD", data);
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
            console.log("RESPONSSE", response?.sizesMap);
            if (response?.data) {
                await this.client.sendApproveMessage(chatId);
                this.proceedPolls(chatId, msg, text, response.sizesMap);
            }
        } else {
            if (msg.text === '/start') {
                this.onStart(msg);
            } else {
                this.client.sendNoLinkMessage(chatId);
            }
        }
    }

    private async proceedPolls(chatId: number, msg: Message, text: string, sizesMap: TSizeOption[]) {
        const sizeNames = sizesMap.map((size: TSizeOption) => size.size);
        const sizeOptions = this.splitOptionsIntoPolls(sizeNames);
        console.log("SIZE OPTIONSS", sizeOptions, sizesMap);
        log("TRY ADD LINK", msg);
        await this.addLink(msg, sizesMap);
        await Promise.all(sizeOptions.map(async (options) => {
            console.log(options);
            const poll = await this.client.sendPoll(chatId, options);
            if (poll.poll) {
                options.forEach(size => {
                    sizesMap.map((option: { size: string; }, id: number) => {
                        if (option.size === size) {
                            sizesMap[id].pollId = poll.poll?.id;
                        }
                    });
                });
                this.addPoll(msg, poll.poll.id, options, text);
            }
        }));
    }

    public async getResponse(link: string, chatId: number) {
        try {
            return await this.parsingController.parse(link);
        } catch (error) {
            if (error instanceof ValidationError) {
                this.client.sendNotValidMessage(chatId);
                console.log(error.name, error.message);
            } else {
                console.error('[getResponse] unexpected error:', error);
            }
            return null;
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
            console.log("CHOSENNN", poll, choosenOptionIds[0]);
            const availableParams = await this.database.getLinkAvailableParameters(poll.url, poll.chat_id);
            if (!availableParams) {
                console.warn(`[onPollVoted] No available parameters found for poll ${poll.poll_id} and user ${pollAnswer.user.id}`);
                return;
            }
            log("AVAILABLE PARAMS", availableParams);
            await Promise.all(choosenOptionIds.map(async id => {
                const choosenSize = pollOptions[id];
                const size = availableParams.find((option: { size: string; }) => option.size === choosenSize);
                console.log("WTFFF", id, choosenSize, size);
                if (size && size.available) {
                    willNotStalkering.push(choosenSize);
                } else {
                    willAdd.push(choosenSize);
                    await this.client.sendItemAddedToStalkerList(poll.chat_id, choosenSize);
                }
            }));
            if (willNotStalkering.length) {
                await this.client.sendItemAvailable(poll.chat_id, willNotStalkering);
            }
            await this.database.addChoosenOptions(poll.poll_id, pollAnswer.user.id, poll.url, willAdd);
        }
        console.log('pollAnswerrrr', pollAnswer);
    }

    public async checkIfSelectedParamsAvailable(link: TTableLinkData) {
        const dbLink = await this.database.getLink(link.url, link.chat_id);
        if (!dbLink) {
            console.warn(`[checkActiveLinks] No active link found for user ${link.user_id} and URL ${link.url}`);
            return;
        }
        const selectedParams = dbLink.selected_params as string[];
        log("SELECTED PARAMS666", selectedParams);
        if (!selectedParams || selectedParams.length === 0) {
            console.log(`[checkIfSelectedParamsAvailable] No selected params to check for link ${link.url}`);
            return;
        } else {
            console.log(`[checkIfSelectedParamsAvailable] Selected params to check for link ${link.url}, ${selectedParams.join(', ')}`);

        }
        const response = await this.getResponse(link.url, link.chat_id);
        if (!response) {
            return
        };
        const sizesMap = response.sizesMap;
        log("SIZESS MAP777", sizesMap);
        console.log(`[checkIfSelectedParamsAvailable] Parsed ${link.url}: ${sizesMap.length} sizes found`);
        const { nowAvailable, stillUnavailable } = this.getUpdatedSizesData(selectedParams, sizesMap);
        log(`[checkIfSelectedParamsAvailable] For link ${link.url}, now available: ${nowAvailable.join(', ')}, still unavailable: ${stillUnavailable.join(', ')}`);
        const updateData: any = { available_params: sizesMap };

        if (nowAvailable.length > 0) {
            console.log(`[checkIfSelectedParamsAvailable] Sizes now available: ${nowAvailable.join(', ')}`);
            await this.client.sendNewItemAvailable(link.chat_id, nowAvailable, link.url);
            updateData.selected_params = stillUnavailable;
        }

        if ((nowAvailable.length === selectedParams.length && stillUnavailable.length === 0 && selectedParams.length > 0)) {
            console.log(`[checkIfSelectedParamsAvailable] All selected sizes are now available, deactivating link`, link.chat_id);
            await this.client.sendDeactivateLink(link.chat_id, link.url);
            updateData.is_active = false;
            updateData.selected_params = [];
        }
        await this.database.updateLinkData(dbLink.id, updateData, dbLink.user_id);
    }

    protected getUpdatedSizesData(selectedParams: string[], sizesMap: TSizeOption[]) {
        const nowAvailable: string[] = [];
        const stillUnavailable: string[] = [];
        selectedParams.forEach((selectedSize: string) => {
            const currentSize = sizesMap.find(
                (size: TSizeOption) => this.normilizeSize(size.size) === this.normilizeSize(selectedSize)
            );
            log(`[checkIfSelectedParamsAvailable] currentSize ${currentSize}`, selectedSize, sizesMap);
            if (currentSize) {
                if (currentSize.available) {
                    nowAvailable.push(selectedSize);
                } else {
                    stillUnavailable.push(selectedSize);
                }
            } else {
                console.warn(`[checkIfSelectedParamsAvailable] Size ${selectedSize} not found in current product data`);
            }
        });
        return { nowAvailable, stillUnavailable };
    }

    protected normilizeSize(size: string) {
        return size.trim().toLowerCase();
    }
}