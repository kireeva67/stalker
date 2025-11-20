import { log } from "console";
import { TSizeOption } from "../bot/Types";
import AbstractParser from "./AbstractParser";
import jsdom from "jsdom";
const { JSDOM } = jsdom;

export default class MangoParser extends AbstractParser {
    protected readonly sizeItemSelector = ".SizeItemContent_sizeInfo__bgdpC";
    protected readonly notAvailableClassName = "SizeItemContent_notAvailable__2WJ__";

    public getAllSizesMap(data: any): TSizeOption[] {
        if (!data) {
            console.warn("[MangoParser] Missing HTML data payload");
            return [];
        }

        const dom = new JSDOM(data);
        const document = dom.window.document;
        const sizeElements = Array.from(document.querySelectorAll(this.sizeItemSelector));
        if (!sizeElements.length) {
            console.warn("[MangoParser] Unable to locate size elements by selector", this.sizeItemSelector);
            return [];
        }

        const sizesMap = sizeElements
            .map(element => this.mapElementToSizeOption(element))
            .filter((option): option is TSizeOption => Boolean(option));

        return sizesMap;
    }

    protected mapElementToSizeOption(element: Element): TSizeOption | null {
        const sizeLabel = element.textContent?.trim();
        if (!sizeLabel) {
            return null;
        }

        const classList = Array.from(element.classList);
        const available = !classList.includes(this.notAvailableClassName);
        // log(`[MangoParser] Mapped size option: ${sizeLabel}, available: ${available}`, classList);

        return {
            size: sizeLabel,
            available,
            pollId: undefined,
        };
    }
}