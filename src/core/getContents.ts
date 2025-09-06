import { request } from './request';
import { charsetConverter } from './charsetConverter';

export const getContents = async (
  url: string,
  config?: RequestInit
): Promise<string> => {
  const headers = config?.headers;
  const res = await request.get(url, { headers });
  return charsetConverter(res.arrayBuffer ?? res.text ?? '');
};
