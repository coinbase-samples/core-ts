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
import { AxiosHeaders, AxiosRequestConfig } from 'axios';
import { CoinbaseCredentials } from '../credentials';
import { TransformRequestFn, TransformResponseFn } from './httpClient';

// TODO: document these well
export interface CoinbaseCallOptions {
  signal?: AbortSignal;
  timeout?: number;
  retryStatusCodes?: number[];
  retries?: number;
  retryCustomFunction?: (retryCount: number) => number;
  retryDelay?: number;
  retryExponential?: boolean;
  transformRequest?: TransformRequestFn | TransformRequestFn[];
  transformResponse?: TransformResponseFn | TransformResponseFn[];
}

export class CoinbaseHttpRequest {
  private credentials: CoinbaseCredentials | undefined;
  private requestOptions: AxiosRequestConfig;
  readonly method: string;
  readonly baseURL: string;
  readonly url: string;
  readonly body: Record<string, any> | undefined;
  public headers: AxiosHeaders;
  readonly signal?: AbortSignal;
  public callOptions?: CoinbaseCallOptions;
  private fullUrl: string;

  constructor(
    httpMethod: string,
    apiBasePath: string,
    requestPath: string = '',
    credentials?: CoinbaseCredentials,
    queryParams?: Record<string, any>,
    bodyParams?: Record<string, any>,
    callOptions?: CoinbaseCallOptions
  ) {
    this.credentials = credentials;
    const queryString = this.buildQueryString(queryParams);
    this.fullUrl = `${apiBasePath}${requestPath}${queryString}`;

    this.method = httpMethod;
    this.baseURL = apiBasePath;
    this.url = requestPath;
    this.callOptions = callOptions;
    this.body = bodyParams;

    const headers: AxiosHeaders = this.AddAuthHeader();
    this.requestOptions = {
      method: httpMethod,
      headers,
      url: requestPath,
      data: bodyParams,
      signal: callOptions?.signal,
      timeout: callOptions?.timeout || 5000,
    };
    this.headers = headers;
  }

  AddAuthHeader() {
    const headers: AxiosHeaders = new AxiosHeaders();
    // sdk library responsibility to maintain public vs non-public endpoints
    if (this.credentials !== undefined) {
      const authHeaders = this.credentials.generateAuthHeaders(
        this.method,
        this.fullUrl,
        this.body?.toString() || ''
      );

      headers.set(authHeaders);
    }

    return headers;
  }

  AddHeader(key: string, value: string) {
    if (!(this.requestOptions.headers instanceof AxiosHeaders)) {
      this.requestOptions.headers = new AxiosHeaders();
    }
    this.requestOptions.headers.append(key, value);
    this.headers = this.requestOptions.headers as AxiosHeaders;
  }

  filterParams(data: Record<string, any>) {
    const filteredParams: Record<string, any> = {};

    for (const key in data) {
      if (data[key] !== undefined) {
        filteredParams[key] = data[key];
      }
    }

    return filteredParams;
  }

  buildQueryString(queryParams?: Record<string, any>): string {
    if (!queryParams || Object.keys(queryParams).length === 0) {
      return '';
    }

    const queryString = Object.entries(queryParams)
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map(
            (item) => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`
          );
        } else {
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
      })
      .join('&');

    return `?${queryString}`;
  }
}
