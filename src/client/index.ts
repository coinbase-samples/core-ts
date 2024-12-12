import { CoinbaseCredentials } from '../credentials';
import { USER_AGENT } from '../constants';
import {
  CoinbaseHttpClient,
  HttpClient,
  CoinbaseHttpRequestOptions,
  CoinbaseResponse,
} from '../http/httpClient';

export interface GenericClient {
  readonly apiBasePath: string;
  request(options: CoinbaseHttpRequestOptions): Promise<any>;
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
}
