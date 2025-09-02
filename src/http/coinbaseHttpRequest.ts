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
import { DEFAULT_HTTP_TIMEOUT } from '../constants';
import { CoinbaseCallOptions } from './options';

export class CoinbaseHttpRequest {
  private credentials: CoinbaseCredentials | undefined;
  private requestOptions: AxiosRequestConfig;
  readonly method: string;
  readonly baseURL: string;
  readonly url: string;
  readonly data: Record<string, any> | undefined;
  public headers: AxiosHeaders;
  readonly signal?: AbortSignal;
  public callOptions?: CoinbaseCallOptions;
  private fullUrl: string;
  readonly params: URLSearchParams;

  constructor(
    method: string,
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

    this.method = method;
    this.baseURL = apiBasePath;
    this.url = requestPath;
    this.callOptions = callOptions;
    this.data = bodyParams;
    this.params = this.sanitizeParams(this.buildURLSearchParams(queryParams));
    const headers: AxiosHeaders = this.addAuthHeader();
    this.requestOptions = {
      method,
      headers,
      url: requestPath,
      data: bodyParams,
      signal: callOptions?.signal,
      timeout: callOptions?.timeout || DEFAULT_HTTP_TIMEOUT,
    };
    this.headers = headers;
  }

  addAuthHeader() {
    const headers: AxiosHeaders = new AxiosHeaders();
    // sdk library responsibility to maintain public vs non-public endpoints
    if (this.credentials !== undefined) {
      const authHeaders = this.credentials.generateAuthHeaders(
        this.method,
        this.fullUrl,
        JSON.stringify(this.data) || ''
      );

      headers.set(authHeaders);
    }

    return headers;
  }

  addHeader(key: string, value: string) {
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

  private isValidValue(value: any): boolean {
    return (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'null' &&
      value !== 'undefined'
    );
  }

  private buildURLSearchParams(
    queryParams?: Record<string, any>
  ): URLSearchParams {
    const params = new URLSearchParams();

    if (!queryParams) {
      return params;
    }

    // Manually handle each parameter to support arrays
    for (const [key, value] of Object.entries(queryParams)) {
      if (Array.isArray(value)) {
        // Add each array element as a separate parameter with the same key
        value.forEach((item) => {
          if (this.isValidValue(item)) {
            params.append(key, String(item));
          }
        });
      } else if (this.isValidValue(value)) {
        // Handle string values that might be comma-separated
        const stringValue = String(value);
        if (stringValue.includes(',')) {
          // Split comma-separated values and add each as a separate parameter
          stringValue.split(',').forEach((item) => {
            const trimmedItem = item.trim();
            if (trimmedItem) {
              params.append(key, trimmedItem);
            }
          });
        } else {
          params.append(key, stringValue);
        }
      }
    }

    return params;
  }

  buildQueryString(queryParams?: Record<string, any>): string {
    if (!queryParams || Object.keys(queryParams).length === 0) {
      return '';
    }

    const params = this.buildURLSearchParams(queryParams);
    const sanitizedParams = this.sanitizeParams(params);
    return `?${sanitizedParams.toString()}`;
  }

  sanitizeParams(params: URLSearchParams) {
    const emptyParams: string[] = [];
    params.forEach((value, key) => {
      if (!this.isValidValue(value)) {
        emptyParams.push(key);
      }
    });

    emptyParams.forEach((key) => {
      params.delete(key);
    });
    return params;
  }
}
