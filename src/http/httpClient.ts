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
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { CoinbaseCredentials } from '../credentials';
import { CoinbaseHttpRequest } from './coinbaseHttpRequest';
import {
  CoinbaseHttpClientRetryOptions,
  CoinbaseHttpRequestOptions,
  HttpClient,
  Method,
  TransformRequestFn,
  TransformResponseFn,
} from './options';

export class CoinbaseHttpClient implements HttpClient {
  private credentials: CoinbaseCredentials | undefined;
  private httpClient: HttpClient;
  private apiBasePath: string;
  private userAgent: string;
  private httpOptions?: CoinbaseHttpClientRetryOptions;

  constructor(
    apiBasePath: string,
    userAgent: string,
    credentials?: CoinbaseCredentials,
    options?: CoinbaseHttpClientRetryOptions
  ) {
    this.apiBasePath = apiBasePath;
    this.userAgent = userAgent;
    this.credentials = credentials;
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
      });
    } else if (typeof transformRequest === 'function') {
      axiosClient.interceptors.request.use(transformRequest, null);
    }

    const transformResponse = options?.transformResponse
      ? Array.isArray(options.transformResponse)
        ? (options.transformResponse as TransformResponseFn[])
        : (options.transformResponse as TransformResponseFn)
      : [];

    if (Array.isArray(transformResponse)) {
      transformResponse.forEach((transformer) => {
        axiosClient.interceptors.response.use(transformer, null);
      });
    } else if (typeof transformResponse === 'function') {
      axiosClient.interceptors.response.use(transformResponse, null);
    }

    return {
      sendRequest: axiosClient.request,
      // stubs to allow for replacement
      transformRequest,
      transformResponse,
    };
  }

  sendRequest(options: CoinbaseHttpRequestOptions): Promise<any> {
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

    if (options.callOptions) {
      //Does this need a custom transformer?
      const combinedOptions = {
        ...this.httpOptions,
        ...options.callOptions,
      };
      const callSpecificClient = this._setupHttpClient(combinedOptions);
      return callSpecificClient.sendRequest(cbRequest);
    } else {
      return this.httpClient.sendRequest(cbRequest);
    }
  }

  transformRequest(config: any) {
    return config;
  }

  transformResponse(response: any) {
    return response;
  }
}
