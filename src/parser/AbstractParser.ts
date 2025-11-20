import axios, { AxiosResponse } from 'axios';
import { ValidationError } from '../error/ValidationError';
import { TSizeOption } from '../bot/Types';

export default class AbstractParser {
    protected link: string = '';
    protected userAgent: string;

    constructor() {
        this.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
    }

    public getDataLink(link: string): string {
        return link;
    }

    public async getData(link: string) {
        try {
            const response: AxiosResponse = await axios.get(link, { headers: { "User-Agent": this.userAgent } });
            this.link = link;
            return response.data;
        } catch (error) {
            throw new ValidationError('Link is not valid');
        }
    }

    public getAllSizesMap(data: any): TSizeOption[] {
        return [];
    }
}
