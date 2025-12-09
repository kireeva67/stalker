import { PrismaClient } from '@prisma/client';
import { DataBaseURLIsNotSetError } from '../error/DataBaseURLIsNotSetError';
import { TTableLinkData, TTablePollData, TTableUserData } from './TableTypes';
import { singleton } from 'tsyringe';
import { TSizeOption } from '../bot/Types';
import { log } from 'node:console';

@singleton()
export class Database {
    private prisma;
    private databaseUrl: string | undefined;

    constructor() {
        this.databaseUrl = process.env.DATABASE_URL;
        if (!this.databaseUrl) {
            throw new DataBaseURLIsNotSetError("DATABASE_URL is not set in your environment variables.");
        }
        this.prisma = new PrismaClient();
    }

    public async getAllUsers() {
        return await this.prisma.user.findMany()
    }

    public async getAllPolls() {
        return await this.prisma.polls.findMany()
    }

    public async addUser(data: TTableUserData) {
        const doesUserExsist = await this.doesUserExsist(data.telegram_id);
        console.log("USER EXSIST??", doesUserExsist);
        if (!doesUserExsist) {
            await this.prisma.user.create({ data });
            // console.log("ALLL USERS", await this.getAllUsers());
        }
    }

    public async addLink(data: TTableLinkData, userId: number) {
        const links = await this.doesUserHasLink(userId, data?.url);
        console.log("USER LINKS???", links?.length);
        if (links?.length) {
            await this.prisma.links.updateMany({
                where: {
                    id: { in: links.map((link: any) => link.id) }
                },
                data: { is_active: false }
            });
        }

        const link = await this.prisma.links.create({
            data: {
                url: data.url,
                available_params: data.available_params,
                is_active: true,
                chat_id: data.chat_id,
                user: {
                    connect: { telegram_id: userId }
                },
            },
        });
    }

    public async addPoll(data: TTablePollData, userId: number) {
        const poll = await this.prisma.polls.create({
            data: {
                poll_id: data.poll_id,
                chat_id: data.chat_id,
                options: data.options,
                url: data.url,
                user: {
                    connect: { telegram_id: userId }
                },
            },
        });
        // console.log("ALL POLLS", await this.prisma.polls.findMany());
    }

    public async getPoll(userId: number, pollId: string) {
        // console.log('POLLLSSS0000', await this.prisma.polls.findMany());
        const user = await this.getUser(userId);
        if (user?.id) {
            const polls = await this.prisma.polls.findMany({
                where: {
                    user_id: user?.id,
                    poll_id: pollId
                }
            });
            // console.log('POLLLSSS', polls);
            return polls[0];
        }
        return null;
    }

    public async addChoosenOptions(pollId: string, userId: number, url: string, options: string[]) {
        //TODO don't remember why i was need pollId here
        const user = await this.getUser(userId);
        if (!user?.id) {
            console.warn(`[addChoosenOptions] User not found: ${userId}`);
            return;
        }
        const link = await this.getLink(url, userId);

        if (!link) {
            console.warn(`[addChoosenOptions] No active link found for user ${userId} and URL ${url}`);
            return;
        }
        const updatedLink = await this.updateLinkData(link.id, { selected_params: options }, link.user_id);

        console.log(`[addChoosenOptions] Successfully updated link  with ${options.length} selected options`);
        return updatedLink;
    }

    public async updateLinkData(linkId: number, data: any, userId: number) {
        return await this.prisma.links.update({
            where: {
                id: linkId,
                user_id: userId
            },
            data: data
        });
    }

    protected async doesUserHasLink(userId: number, url: string) {
        const user = await this.getUser(userId);
        if (user?.id) {
            const links = await this.prisma.links.findMany({
                where: {
                    user_id: user?.id,
                    url: url
                }
            });
            return links;
        }
    }

    public async getUser(id: number) {
        return await this.prisma.user.findUnique({
            where: {
                telegram_id: id,
            },
        });
    }

    public async getLink(url: string, userId: number) {
        return await this.prisma.links.findFirst({
            where: {
                url: url,
                is_active: true,
                user: { telegram_id: userId }
            }
        });
    }

    protected async doesUserExsist(id: number) {
        const user = await this.prisma.user.findMany({
            where: {
                telegram_id: id,
            },
        });
        return user.length > 0;
    }

    public async getLinkSelectedParameters(url: string, userId: number) {
        const link = await this.getLink(url, userId);
        if (!link) {
            console.warn(`[getLinkSelectedParameters] No active link found for user ${userId} and URL ${url}`);
            return;
        }
        return link.selected_params as string[];
    }

    public async getLinkAvailableParameters(url: string, userId: number) {
        const link = await this.getLink(url, userId);
        if (!link) {
            console.warn(`[getLinkAvailableParameters] No active link found for user ${userId} and URL ${url}`);
            return;
        }
        return link.available_params as TSizeOption[];
    }

    public async getLinksToCheck() {
        return await this.prisma.links.findMany({
            where: {
                is_active: true
            }
        });
    }
}