export class CustomSuccess {
  constructor(successCode, statusCode = 200, message, result = {}) {
    this.successCode = successCode;
    this.statusCode = statusCode;
    this.message = message;
    this.result = result;
  }
}