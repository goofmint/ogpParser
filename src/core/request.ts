type RequestConfig = {
  url: string;
  method?: string;
  headers?: any;
  body?: any;
};

type ResponseData<T> = {
  status: number;
  text: string;
  arrayBuffer: ArrayBuffer;
  data?: T;
  config: RequestConfig;
};

const REDIRECT_LOOP_LIMIT = 20;

const httpRequest = async <T = any>(
  url: string,
  options: RequestInit = {},
  count = 0
): Promise<ResponseData<T>> => {
  if (count > REDIRECT_LOOP_LIMIT) {
    throw new Error('Request Error');
  }
  const res = await fetch(url, options);
  const status = res.status ?? 0;
  // Follow redirects when Location header present (MSW returns mocked 3xx responses)
  if (status >= 300 && status < 400) {
    const location = res.headers?.get ? res.headers.get('location') : undefined;
    if (location) {
      const original = new URL(url);
      const next = new URL(location, original.origin).toString();
      return httpRequest<T>(next, options, count + 1);
    }
  }
  const arrayBuffer = await res.arrayBuffer();
  const text = new TextDecoder('utf-8').decode(arrayBuffer);
  const responseData: ResponseData<T> = {
    status,
    text,
    arrayBuffer,
    data: undefined,
    config: { url, method: options.method, headers: options.headers as any, body: (options as any).body },
  };
  try { responseData.data = JSON.parse(text); } catch {}
  return responseData;
};

export type RequestOptions = Omit<RequestInit, 'method'>;

export const request = {
  get: <T = any>(url: string, options: RequestInit = {}) =>
    httpRequest<T>(url, { ...options, method: 'GET' }),
  post: <T = any>(url: string, options: RequestInit = {}) =>
    httpRequest<T>(url, { ...options, method: 'POST' }),
};
