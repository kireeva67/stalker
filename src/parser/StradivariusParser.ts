import AbstractParser from "./AbstractParser";
import jsdom from "jsdom";
const { JSDOM } = jsdom;

export default class StradivariusParser extends AbstractParser {
  private colorId: string | null;

  public getDataLink(link: string): string {
    const url = new URL(link);
    console.log("url.searchParams", url.searchParams);
    this.colorId = url.searchParams.get("colorId");
    const productId = url.searchParams.get("pelement");
    return `https://www.stradivarius.com/itxrest/2/catalog/store/54009574/50331065/category/0/product/${productId}/detail?languageId=-22&appId=1`;
  }

  public getAllColorsMap() {
    const colors = this.data["bundleColors"];
    const a = this.data["bundleProductSummaries"][0]["detail"]["xmedia"];
    for (const color of colors) {
      this.colorsMap.set(color.id, color.name);
    }
    return this.colorsMap;
  }

  public getAllSizesMap() {
    const color = this.data["bundleProductSummaries"][0]["detail"][
      "colors"
    ].find((el: any) => el.id === this.colorId);
    const sizes = color["sizes"];
    const dataArray: any[] = [];
    sizes.forEach((data: any) => {
      const names = dataArray.map((data) => data.name);
      if (names.includes(data.name)) {
        const index = dataArray.findIndex((el) => el.name === data.name);
        const el = dataArray[index];
        if (!el.skuDimensions.length) {
          dataArray[index] = data;
        }
      } else {
        dataArray.push(data);
      }
    });
    const sizesMap: Map<string, boolean> = new Map();
    dataArray.forEach((data) => {
      sizesMap.set(data.name, data.visibilityValue === "SHOW");
    });
    this.sizesMap = sizesMap;
    console.log("getAllSizes", sizesMap);
    return sizesMap;
  }
}
