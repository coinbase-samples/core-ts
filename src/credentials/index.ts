export interface CoinbaseCredentials {
  generateAuthHeaders(
    requestMethod: string,
    requestPath: string,
    body: string
  ): Record<string, string>;
}
