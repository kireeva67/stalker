import AbstractParser from "../AbstractParser";
import MangoParser from "../MangoParser";
import PullAndBearParser from "../PullAndBearParser";
import StradivariusParser from "../StradivariusParser";

enum Parsers {
    MANGO = 'shop.mango.com',
    PULLANDBEAR = 'www.pullandbear.com',
    ZARA = 'www.zara.com',
    BERSHKA = 'www.bershka.com',
    STRADIVARIUS = 'www.stradivarius.com'
}

export default class ParsingController {
    private parser: AbstractParser;

    public setUpParser(link: string) {
        const url = new URL(link);
        console.log(url);
        const hostName = url.hostname;
        this.parser = this.getParser(hostName);
        return this.parser;
    }

    public async parse(link: string) {
        const dataLink = await this.parser.getDataLink(link);
        const data = await this.parser.getData(dataLink);
        console.log('DATA', dataLink);
        // writeFileSync(`new22.html`, data);
        return data;   
    }

    public getColorNames() {
        this.parser.getAllColorsMap();
       return this.parser.getAllColorNames();
    }

    public getSizesNames() {
        this.parser.getAllSizesMap();
       return this.parser.getAllSizesNames();
    }

    public getParser(hostName: string) {
        switch (hostName) {
            case Parsers.MANGO:
                return new MangoParser();
            case Parsers.ZARA:
                return new MangoParser();
            case Parsers.PULLANDBEAR: 
                return new PullAndBearParser();
            case Parsers.BERSHKA:
                return new MangoParser();
            case Parsers.STRADIVARIUS:
                return new StradivariusParser();
            default:
                return new AbstractParser();
                break;
        }
    }
}