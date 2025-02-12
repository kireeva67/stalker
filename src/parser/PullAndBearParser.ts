import { TSizeOption } from "../bot/Types";
import AbstractParser from "./AbstractParser";
import jsdom from "jsdom";
const { JSDOM } = jsdom;

export default class PullAndBearParser extends AbstractParser {
  public getAllSizesMap(): TSizeOption[] {
    const notAvailableClassName = "SizeItemContent_notAvailable__ra6rw";
    const dom = new JSDOM(this.data);
    const elementsCollection = dom.window.document.getElementsByClassName(
      "SizeItemContent_sizeInfo__v8gzJ"
    );
    let sizesMap: TSizeOption[] = [];
    if (elementsCollection.length) {
        const elementsArray = Array.from(elementsCollection);
        sizesMap = elementsArray.map((element) => {
          const classList = Array.from(element.classList);
          const available = !classList.includes(notAvailableClassName);
          return <TSizeOption>{ size: element.textContent, available };
          }); 
        }

        console.log("getAllSizes", sizesMap);
        return sizesMap;
    }
}
