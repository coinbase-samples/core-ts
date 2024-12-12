import axios from 'axios';
import axiosRetry from 'axios-retry';
import { CoinbaseCredentials } from '../credentials';
import {
  CoinbaseCallOptions,
  CoinbaseHttpRequest,
} from './coinbaseHttpRequest';

export enum Method {
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export type TransformRequestFn = (data: any, header: any) => any;
export type TransformResponseFn = (data: any) => any;

export interface CoinbaseHttpClientRetryOptions {
  timeout?: number;
  retryStatusCodes?: number[];
  retries?: number;
  retryDelay?: number;
  retryExponential?: boolean;
  retryCustomFunction?: (retryCount: number) => number;
  transformRequest?: TransformRequestFn | TransformRequestFn[];
  transformResponse?: TransformResponseFn | TransformResponseFn[];
}

export interface CoinbaseHttpRequestOptions {
  url?: string;
  method?: string | undefined;
  queryParams?: Record<string, any>;
  bodyParams?: Record<string, any>;
  callOptions?: CoinbaseCallOptions;
}

export interface CoinbaseResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface HttpClient {
  sendRequest(options: CoinbaseHttpRequestOptions): Promise<CoinbaseResponse>;
  transformRequest: TransformRequestFn | TransformRequestFn[];
  transformResponse: TransformResponseFn | TransformResponseFn[];
}

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
      if (options.retryDelay) {
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

    return {
      sendRequest: axiosClient.request,
      // stubs to allow for replacement
      transformRequest: options?.transformRequest
        ? Array.isArray(options.transformRequest)
          ? (options.transformRequest as TransformRequestFn[])
          : (options.transformRequest as TransformRequestFn)
        : [],
      transformResponse: options?.transformResponse
        ? Array.isArray(options.transformResponse)
          ? (options.transformResponse as TransformResponseFn[])
          : (options.transformResponse as TransformResponseFn)
        : [],
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

  transformRequest(request: any, headers: any) {
    return request;
  }

  transformResponse(response: any) {
    return response;
  }
}
