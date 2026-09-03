export type ApiQueryParams = Record<string, string | number | boolean | undefined | null>;

export type ApiGet = (path: string, params?: ApiQueryParams) => Promise<unknown>;
export type ApiPost = (path: string, body?: unknown) => Promise<unknown>;
export type ApiPatch = (path: string, body?: unknown) => Promise<unknown>;
export type ApiPut = (path: string, body?: unknown) => Promise<unknown>;
export type ApiDelete = (path: string) => Promise<void>;

export interface ApiClient {
  get: ApiGet;
  post: ApiPost;
  patch: ApiPatch;
  put: ApiPut;
  delete: ApiDelete;
}

let _client: ApiClient | null = null;

export function initApiClient(client: ApiClient): void {
  _client = client;
}

export function getApiClient(): ApiClient {
  if (!_client) throw new Error("API client not initialised — call initApiClient() at app startup");
  return _client;
}