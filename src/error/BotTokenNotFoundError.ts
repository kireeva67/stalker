export class BotTokenNotFound extends Error {
    constructor(message: string) {
      super(message);
      this.name = "BotTokenNotFound";
    }
}