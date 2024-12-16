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

import { CoinbaseCredentials } from '../credentials';
import { USER_AGENT } from '../constants';
import { CoinbaseHttpClient } from '../http/httpClient';
import {
  HttpClient,
  CoinbaseHttpRequestOptions,
  CoinbaseResponse,
} from '../http/options';

export interface GenericClient {
  /**
   * Base URL for the API. e.g. 'https://api.prime.coinbase.com/v1/
   */
  readonly apiBasePath: string;
  request(options: CoinbaseHttpRequestOptions): Promise<any>;
  AddHeader(key: string, value: string): void;
}

export class CoinbaseClient {
  readonly apiBasePath: string;
  readonly userAgent: string;
  private httpClient: HttpClient;

  constructor(
    apiBasePath: string,
    credentials?: CoinbaseCredentials,
    userAgent?: string
  ) {
    this.apiBasePath = apiBasePath;
    typeof userAgent === 'string' && userAgent.length > 0
      ? (this.userAgent = userAgent)
      : (this.userAgent = USER_AGENT);
    this.httpClient = new CoinbaseHttpClient(
      apiBasePath,
      this.userAgent,
      credentials
    );
  }

  request(options: CoinbaseHttpRequestOptions): Promise<CoinbaseResponse> {
    return this.httpClient.sendRequest(options);
  }

  AddHeader(key: string, value: string) {
    this.httpClient.AddHeader(key, value);
  }
}
