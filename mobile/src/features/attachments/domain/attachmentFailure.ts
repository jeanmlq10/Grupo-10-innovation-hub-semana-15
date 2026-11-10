export class AttachmentFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentFailure";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
