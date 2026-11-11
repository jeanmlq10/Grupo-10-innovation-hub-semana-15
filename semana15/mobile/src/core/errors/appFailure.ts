// Equivalente de core/errors/app_failure.dart: un error pensado para
// mostrarse al usuario tal cual.
export class AppFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toString(): string {
    return this.message;
  }
}
