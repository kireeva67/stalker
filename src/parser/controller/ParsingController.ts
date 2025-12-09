import { singleton } from "tsyringe";
import AbstractParser from "../AbstractParser";
import MangoParser from "../MangoParser";
import { writeFileSync } from "node:fs";

export enum Parsers {
    MANGO = 'shop.mango.com',
}

@singleton()
export default class ParsingController {

    protected getParser(link: string) {
        const url = new URL(link);
        console.log(url);
        const hostName = url.hostname;
        return this.createParser(hostName);
    }

    public async parse(link: string) {
        const parser = this.getParser(link);
        const dataLink = await parser.getDataLink(link);
        const data = await parser.getData(dataLink);
        const sizesMap = parser.getAllSizesMap(data, link);
        console.log('DATA', dataLink, sizesMap);
        writeFileSync(`htmlToCheck.html`, data);
        return { data, sizesMap };
    }

    public createParser(hostName: string) {
        switch (hostName) {
            case Parsers.MANGO:
                return new MangoParser();
            default:
                return new AbstractParser();
        }
    }
}