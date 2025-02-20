import { PrismaClient } from '@prisma/client';
import { DataBaseURLIsNotSetError } from '../error/DataBaseURLIsNotSetError';
import { TTableLinkData, TTablePollData, TTableUserData } from './TableTypes';

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
            console.log("ALLL USERS", await this.getAllUsers());
        }
    }

    public async addLink(data: TTableLinkData, userId: number) {
        const links = await this.doesUserHasLink(userId, data?.url);
        if (links) {
            const isNewLink = links.length > 0;
            console.log("USER HAS LINK?", isNewLink, data);  
            
            await Promise.all(links.map(async (link: any) => {
                const updatedLink = await this.prisma.links.update({
                    where: {
                        id: link.id
                    },
                    data: { is_active: false }
                });
                console.log('LINK IS NOT ACTIVE ANYMORE', updatedLink);
            }));

            const link = await this.prisma.links.create({
                data: {
                    url: data.url,
                    available_params: data.available_params,
                    is_active: true,
                    user: {
                    connect: { telegram_id: userId }
                    },
                },
            });
        }
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
        console.log("ALL POLLS", await this.prisma.polls.findMany());
    }

    public async getPoll(userId: number, pollId: string) {
        console.log('POLLLSSS0000', await this.prisma.polls.findMany());
        const user = await this.getUser(userId);
        if (user?.id) {
            const polls = await this.prisma.polls.findMany({
                where: {
                    user_id: user?.id,
                    poll_id: pollId
                }
            });
            console.log('POLLLSSS', polls);
            return polls[0];
        }
        return null;
    }

    public async addChoosenOptions(pollId: string, userId: number, url: string, options: string[]) {
        //TODO find link where available_params keep same pollId!!!
        const link = await this.prisma.links.findFirst({
            where: {
                url: url,
                is_active: true
            }
        });
        console.log('AAAAAAAAAAAAAAAAAAA', link);
       
        if (link && link.available_params) {
            console.log('addChoosenOptions', link, pollId, link.is_active, options);
            const updatedLink = await this.prisma.links.update({
                where: {
                    id: link.id
                },
                data: { selected_params:  options }
            });
            console.log('ADDED OPTIONS', updatedLink);
        }        
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

    protected async doesUserExsist(id: number) {
        const user = await this.prisma.user.findMany({
            where: {
                telegram_id: id,
            },
        });
        return user.length > 0;
    }
}