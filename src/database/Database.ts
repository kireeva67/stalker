import { PrismaClient } from '@prisma/client';
import { DataBaseURLIsNotSetError } from '../error/DataBaseURLIsNotSetError';
import { TTableUserData } from './TableTypes';

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

    public async addUser(data: TTableUserData) {
        const doesUserExsist = await this.doesUserExsist(data.telegram_id);
        console.log("USER EXSIST??", doesUserExsist);  
        if (!doesUserExsist) {
            await this.prisma.user.create({ data });
            console.log("ALLL USERS", await this.prisma.user.findMany());
        }
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