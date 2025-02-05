import { TSizeOption } from "../bot/Types";
import AbstractParser from "./AbstractParser";
import jsdom from "jsdom";
const { JSDOM } = jsdom;

export default class MangoParser extends AbstractParser {

    public getAllSizesMap(): Map<string, boolean> {
        const notAvailableClassName = "SizeItemContent_notAvailable__ra6rw";
        const dom = new JSDOM(this.data);
        const elementsCollection = dom.window.document.getElementsByClassName("SizeItemContent_sizeInfo__v8gzJ");
        const sizesMap: Map<string, boolean> = new Map();
        if (elementsCollection.length) {
            const elementsArray = Array.from(elementsCollection);
            elementsArray.forEach((element) => {
                const classList = Array.from(element.classList);
                const available = !classList.includes(notAvailableClassName);
                if (element.textContent) {
                    sizesMap.set(element.textContent, available);
                }
            });  
        }
        this.sizesMap = sizesMap;
        console.log('getAllSizes', sizesMap);
        return sizesMap;
    };
}