import { PrismaClient } from '@prisma/client';
import { DataBaseURLIsNotSetError } from '../error/DataBaseURLIsNotSetError';
import { TTableLinkData, TTableUserData } from './TableTypes';

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

    public async addUser(data: TTableUserData) {
        const doesUserExsist = await this.doesUserExsist(data.telegram_id);
        console.log("USER EXSIST??", doesUserExsist);  
        if (!doesUserExsist) {
            await this.prisma.user.create({ data });
            console.log("ALLL USERS", await this.getAllUsers());
        }
    }

    public async addLink(data: TTableLinkData, userId: number) {
        const doesUserHasLink = await this.doesUserHasLink(userId, data?.url);
        console.log("USER HAS LINK?", doesUserHasLink, data);  
        if (!doesUserHasLink) {
            const link = await this.prisma.links.create({
                data: {
                    url: data.url,
                    available_params: data.available_params,
                    user: {
                    connect: { telegram_id: userId }
                    },
                },
            });
            console.log("ALL LINKS", await this.prisma.links.findMany(), link?.available_params);
        }
    }

    protected async doesUserHasLink(userId: number, url: string) {
        const user = await this.getUser(userId);
        const links = await this.prisma.links.findMany({
            where: {
                user_id: user?.id,
                url: url
            }
        });
        return links.length > 0;
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