import { log } from "console";
import { TSizeOption } from "../bot/Types";
import AbstractParser from "./AbstractParser";

export default class MangoParser extends AbstractParser {

    public getAllSizesMap(data: any, link: string): TSizeOption[] {
        if (!data) {
            console.warn("[MangoParser] Missing HTML data payload");
            return [];
        }
        const jsonData = this.getJSONData(data);
        const productColors = jsonData.product.colors;
        const color = this.getItemColor(link);
        const itemByColor = this.getItemByColor(color, productColors);
        const sizes = itemByColor?.sizes || [];

        const sizesMap: TSizeOption[] = sizes.map((sizeObj: any) => {
            return {
                size: sizeObj.label,
                available: sizeObj.available,
                lastUnits: Boolean(sizeObj.lastUnits),
            };
        });

        log("TARGET SCRIPT", sizesMap);
        return sizesMap;
    }

    protected getItemByColor(color: string, productColors: any[]): any {
        return color.length > 0 ? productColors.find((prodColor: any) => prodColor.id === color) : productColors[0];
    }

    protected getItemColor(link: string): string {
        const colorRegex = /[?&]c=(\d+)/;
        const color = link.match(colorRegex);
        return color ? color[1] : '';
    }

    protected getTargetScript(data: any): string {
        const regex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        const scripts = [...data.matchAll(regex)].map(m => m[1]);
        const keyWords = ["shortDescription", "plusSize", "available", "isDelayed", "lastUnits"];
        return scripts.find(scriptContent =>
            keyWords.every(keyword => scriptContent.toLowerCase().includes(keyword.toLowerCase()))
        );
    }

    protected getJSONData(data: any) {
        const script = this.getTargetScript(data);
        const indexFirst = script.indexOf('{');
        const indexLast = script.lastIndexOf('}');
        const jsonString = script.slice(indexFirst, indexLast + 1).replace(/\\"/g, '"');
        return JSON.parse(jsonString);
    }
}