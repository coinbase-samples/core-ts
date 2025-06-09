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
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { CoinbaseCredentials } from '../credentials';
import { CoinbaseHttpRequest } from './coinbaseHttpRequest';
import {
  CoinbaseHttpClientRetryOptions,
  CoinbaseHttpRequestOptions,
  CoinbaseResponse,
  HttpClient,
  Method,
  TransformRequestFn,
  TransformResponseFn,
} from './options';
import { handleException } from '../error';
import {
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_PAGINATION_MAX_ITEMS,
  DEFAULT_PAGINATION_MAX_PAGES,
} from '../constants';

export class CoinbaseHttpClient implements HttpClient {
  private credentials: CoinbaseCredentials | undefined;
  private httpClient: AxiosInstance;
  private apiBasePath: string;
  private userAgent: string;
  private httpOptions: CoinbaseHttpClientRetryOptions;
  private addedHeaders: Record<string, string> = {};
  private addedRequestTransformers: TransformRequestFn[] = [];
  private addedResponseTransformers: TransformResponseFn[] = [];

  constructor(
    apiBasePath: string,
    userAgent: string,
    credentials?: CoinbaseCredentials,
    options?: CoinbaseHttpClientRetryOptions
  ) {
    this.apiBasePath = apiBasePath;
    this.userAgent = userAgent;
    this.credentials = credentials;
    if (!options) {
      options = {
        defaultLimit: DEFAULT_PAGINATION_LIMIT,
        maxPages: DEFAULT_PAGINATION_MAX_PAGES,
        maxItems: DEFAULT_PAGINATION_MAX_ITEMS,
      };
    }
    if (!options.defaultLimit) options.defaultLimit = DEFAULT_PAGINATION_LIMIT;
    if (!options.maxPages) options.maxPages = DEFAULT_PAGINATION_MAX_PAGES;
    if (!options.maxItems) options.maxItems = DEFAULT_PAGINATION_MAX_ITEMS;
    this.httpOptions = options;
    this.httpClient = this._setupHttpClient(options);
  }

  _setupHttpClient(options?: CoinbaseHttpClientRetryOptions) {
    const axiosClient = axios.create({
      baseURL: this.apiBasePath,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent,
      },
    });

    if (options) {
      if (options.retries) {
        axiosRetry(axiosClient, { retries: options.retries });
      } else if (options.retryDelay) {
        axiosRetry(axiosClient, {
          retryDelay: axiosRetry.linearDelay(options.retryDelay),
        });
      } else if (options.retryExponential) {
        axiosRetry(axiosClient, {
          retryDelay: axiosRetry.exponentialDelay,
        });
      } else if (options.retryCustomFunction) {
        axiosRetry(axiosClient, {
          retryDelay: options.retryCustomFunction,
        });
      }
    }

    const transformRequest = options?.transformRequest
      ? Array.isArray(options.transformRequest)
        ? (options.transformRequest as TransformRequestFn[])
        : (options.transformRequest as TransformRequestFn)
      : [];

    if (Array.isArray(transformRequest)) {
      transformRequest.forEach((transformer) => {
        axiosClient.interceptors.request.use(transformer, null);
        this.addedRequestTransformers.push(transformer);
      });
    } else if (typeof transformRequest === 'function') {
      axiosClient.interceptors.request.use(transformRequest, null);
      this.addedRequestTransformers.push(transformRequest);
    }

    const transformResponse = options?.transformResponse
      ? Array.isArray(options.transformResponse)
        ? (options.transformResponse as TransformResponseFn[])
        : (options.transformResponse as TransformResponseFn)
      : [];

    if (Array.isArray(transformResponse)) {
      transformResponse.forEach((transformer) => {
        axiosClient.interceptors.response.use(transformer, null);
        this.addedResponseTransformers.push(transformer);
      });
    } else if (typeof transformResponse === 'function') {
      axiosClient.interceptors.response.use(transformResponse, null);
      this.addedResponseTransformers.push(transformResponse);
    }

    return axiosClient;
  }

  async sendRequest<T = any>(
    options: CoinbaseHttpRequestOptions
  ): Promise<CoinbaseResponse<T>> {
    const { url, queryParams, bodyParams } = options;
    const requestMethod = (options.method as Method) || Method.GET;

    const cbRequest = new CoinbaseHttpRequest(
      requestMethod,
      this.apiBasePath,
      url,
      this.credentials,
      queryParams,
      bodyParams,
      options.callOptions
    );

    let client = this.httpClient;

    if (options.callOptions) {
      //Does this need a custom transformer?
      const combinedOptions = {
        ...this.httpOptions,
        ...options.callOptions,
      };
      const callSpecificClient = this._setupHttpClient(combinedOptions);
      Object.entries(this.addedHeaders).forEach(([key, value]) => {
        callSpecificClient.defaults.headers[key] = value;
      });
      client = callSpecificClient;
    }

    try {
      const response = await client.request(cbRequest);
      if (response?.headers && typeof response.headers.toJSON === 'function') {
        response.headers = response.headers.toJSON();
      }
      return response as CoinbaseResponse<T>;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        handleException(
          error?.response as CoinbaseResponse<T>,
          error.response?.data,
          error.message
        );
      }
      throw error;
    }
  }

  addHeader(key: string, value: string) {
    this.httpClient.defaults.headers[key] = value;
    this.addedHeaders[key] = value;
  }

  addTransformRequest(func: TransformRequestFn) {
    this.addedRequestTransformers.push(func);
    this.httpClient.interceptors.request.use(func, null);
  }

  addTransformResponse(func: TransformResponseFn) {
    this.addedResponseTransformers.push(func);
    this.httpClient.interceptors.response.use(func, null);
  }

  getDefaultPaginationLimit() {
    return this.httpOptions.defaultLimit;
  }

  getMaxPages() {
    return this.httpOptions.maxPages;
  }

  getMaxItems() {
    return this.httpOptions.maxItems;
  }
}
