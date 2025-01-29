import { PrismaClient } from '@prisma/client';
import { DataBaseURLIsNotSetError } from '../error/DataBaseURLIsNotSetError';

export class Database {
    private prisma;
    private databaseUrl: string | undefined;;

    constructor() {
        this.databaseUrl = process.env.DATABASE_URL;
        if (!this.databaseUrl) {
            throw new DataBaseURLIsNotSetError("DATABASE_URL is not set in your environment variables.");
        }
        this.prisma = new PrismaClient();
    }
}