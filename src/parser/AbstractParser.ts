import axios, { AxiosResponse } from 'axios';
import { ValidationError } from '../error/ValidationError';

export default class AbstractParser {
    sizesMap: Map<string, boolean> = new Map();
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
        const sizes = [];
        for (const size of this.sizesMap.keys()) {
            sizes.push(size);
        }
        return sizes;
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

    public getAllSizesMap(): Map<string, boolean> {
        return this.sizesMap;
    }
}
