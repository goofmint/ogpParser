import { IncomingHttpHeaders } from 'http';
import https, { RequestOptions as RequestOptionsBase } from 'https';

type Options = Pick<RequestOptionsBase, 'headers' | 'method'>;

type RequestConfig = RequestInit & {
  url: string;
};
type ResponseData<T> = {
  status: number;
  headers?: Headers;
  arrayBuffer: ArrayBuffer;
  text: string;
  data?: T;
  config: RequestConfig;
};
const REDIRECT_LOOP_LIMIT = 20;

const httpRequest = async <T = any>(
  url: string,
  options: RequestInit = {},
  count = 0
): Promise<ResponseData<T>> => {
  while (count < REDIRECT_LOOP_LIMIT) {
    try {
      const res = await fetch(url, options);
      const status = res.status ?? 0;
      if (status >= 300 && status < 400 && res.headers.has('location')) {
        const originalUrl = new URL(url);
        const newUrl = new URL(
          res.headers.get('location') ?? '',
          originalUrl.origin
        ).toString();
        return httpRequest(newUrl, options, count + 1);
      }
      const arrayBuffer = await res.arrayBuffer();
      const decoder = new TextDecoder("utf-8");
      const text = decoder.decode(arrayBuffer);
      const responseData: ResponseData<T> = {
        status,
        headers: res.headers,
        text,
        arrayBuffer,
        data: undefined,
        config: {
          ...options,
          url,
        },
      };
      try {
        responseData.data = JSON.parse(text);
      } catch (err) {
      }
      return responseData;
    } catch (err) {
      console.error(err);
      count++;
    }
  }
  throw new Error('Request Error');
};

export type RequestOptions = Omit<Options, 'method'>;

export const request = {
  get: <T = any>(url: string, options: RequestInit = {}) =>
    httpRequest<T>(url, { ...options, method: 'get' }),
  post: <T = any>(url: string, options: RequestInit = {}) =>
    httpRequest<T>(url, { ...options, method: 'post' }),
};
