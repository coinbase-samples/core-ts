export enum Method {
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

/**
 * A function to modify a request config before sending
 */
export type TransformRequestFn = (config: any) => any;

/**
 * A function modify a response object before returning
 */
export type TransformResponseFn = (data: any) => any;

export interface CoinbaseHttpClientRetryOptions {
  /**
   * A number of milliseconds to wait before timing out
   */
  timeout?: number;
  /**
   * A number of times to retry
   *
   */
  retries?: number;
  /**
   * A linear number to increase the delay between retries
   */
  retryDelay?: number;
  /**
   * A boolean to enable exponential backoff for retries
   */
  retryExponential?: boolean;
  /**
   * A function to to calculate the delay between retries
   */
  retryCustomFunction?: (retryCount: number) => number;
  /**
   * A function to modify the request object and/or headers
   */
  transformRequest?: TransformRequestFn | TransformRequestFn[];
  /**
   * A function to modify the response object before returning
   */
  transformResponse?: TransformResponseFn | TransformResponseFn[];
}

export interface CoinbaseHttpRequestOptions {
  /**
   * URL Path
   */
  url?: string;
  /**
   * HTTP Method, prefer enum Method
   */
  method?: string | undefined;
  /**
   * Query Parameters
   */
  queryParams?: Record<string, any>;
  /**
   * Request Body
   */
  bodyParams?: Record<string, any>;
  callOptions?: CoinbaseCallOptions;
}

export interface CoinbaseResponse<T = any> {
  data: T;
  /**
   * HTTP status code
   */
  status: number;
  /**
   * HTTP status message
   */
  statusText: string;
}

export interface HttpClient {
  sendRequest(options: CoinbaseHttpRequestOptions): Promise<CoinbaseResponse>;
  AddHeader(key: string, value: string): void;
  transformRequest: TransformRequestFn | TransformRequestFn[];
  transformResponse: TransformResponseFn | TransformResponseFn[];
}

export interface CoinbaseCallOptions {
  /**
   * A signal to cancel the request
   */
  signal?: AbortSignal;
  /**
   * A number of milliseconds to wait before timing out
   */
  timeout?: number;
  /**
   * A number of times to retry
   *
   */
  retries?: number;
  /**
   * A linear number to increase the delay between retries
   */
  retryDelay?: number;
  /**
   * A boolean to enable exponential backoff for retries
   */
  retryExponential?: boolean;
  /**
   * A function to to calculate the delay between retries
   */
  retryCustomFunction?: (retryCount: number) => number;
  /**
   * A function to modify the request object and/or headers
   */
  transformRequest?: TransformRequestFn | TransformRequestFn[];
  /**
   * A function to modify the response object before returning
   */
  transformResponse?: TransformResponseFn | TransformResponseFn[];
}
