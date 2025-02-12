import axios, { AxiosResponse } from 'axios';
import { ValidationError } from '../error/ValidationError';
import { TSizeOption } from '../bot/Types';

export default class AbstractParser {
    sizesMap: TSizeOption[] = [];
    colorsMap = new Map();
    data: any;
    link: string = '';
    userAgent: string;

    constructor() {
        this.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
    }

    public getDataLink(link: string): string{
        return link;
    }

    public async getData(link: string) {
        try {
          const response: AxiosResponse = await axios.get(link, {headers: {"User-Agent": this.userAgent}});
          this.link = link;
          this.data = response.data;
          return response.data;
        } catch (error) {
          throw new ValidationError('Link is not valid');
        }
    }

    public getAllSizes() {
        return [];
    }

    public getAvailableSizes() {
        return [];
    };

    public getAllSizesNames(): string[] {
        return this.sizesMap.map(size => size.size);
    }

    public getAllColorNames(): string[] {
        const a = [];
        for (const [key, value] of this.colorsMap) {
            a.push(value);
        }
        console.log('wtfff222', this.colorsMap);
        return a;
    }

    public getAllColorsMap() {
        return this.colorsMap;
    }

    public getAllSizesMap(): TSizeOption[] {
        return this.sizesMap;
    }

    public setOptionPollId(size: string, pollId: string) {
        this.sizesMap.map((option, id) => {
            if (option.size === size) {
                this.sizesMap[id].pollId = pollId;
            }
        });
        console.log("RRRRRR", size, this.sizesMap);
    }
}
