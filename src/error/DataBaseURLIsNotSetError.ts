export class DataBaseURLIsNotSetError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "DataBaseURLIsNotSetError";
    }
}