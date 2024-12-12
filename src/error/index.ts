import { CoinbaseResponse } from '../http/httpClient';

export class CoinbaseError extends Error {
  statusCode: number;
  response: CoinbaseResponse;

  constructor(message: string, statusCode: number, response: CoinbaseResponse) {
    super(message);
    this.name = 'CoinbaseError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

export class CoinbaseClientException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoinbaseClientException';
  }
}

export function handleException(
  response: CoinbaseResponse,
  responseText: string,
  reason: string
) {
  let message: string | undefined;

  if (
    (400 <= response.status && response.status <= 499) ||
    (500 <= response.status && response.status <= 599)
  ) {
    if (
      response.status == 403 &&
      responseText.includes('"error_details":"Missing required scopes"')
    ) {
      message = `${response.status} Coinbase Error: Missing Required Scopes. Please verify your API keys include the necessary permissions.`;
    } else
      message = `${response.status} Coinbase Error: ${reason} ${responseText}`;

    throw new CoinbaseError(message, response.status, response);
  }
}
