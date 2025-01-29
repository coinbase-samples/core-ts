/**
 * Copyright 2024-present Coinbase Global, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { CoinbaseResponse } from '../http/options';

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
  response: CoinbaseResponse | undefined,
  responseText: string,
  reason: string
) {
  let message: string | undefined;

  if (response?.status && 400 <= response.status && response.status <= 599) {
    if (
      response.status == 403 &&
      responseText.includes &&
      responseText.includes('"error_details":"Missing required scopes"')
    ) {
      message = `${response.status} Coinbase Error: Missing Required Scopes. Please verify your API keys include the necessary permissions.`;
    } else if ((response.status = 400)) {
      message = `${response.status} Coinbase Invalid Request Error: ${reason} ${response?.data?.message}`;
    } else message = `${response.status} Coinbase Error: ${reason}`;

    throw new CoinbaseError(message, response.status, response);
  }
}
