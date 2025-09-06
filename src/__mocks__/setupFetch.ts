// Minimal fetch polyfill for test runtime when global fetch is not available.
// It uses Node's http/https and follows redirects so our tests behave like real fetch.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const definePolyfill = () => {
  const http = require('http');
  const https = require('https');
  const { Headers } = require('headers-polyfill');

  // Expose Headers for msw's fetch interceptor
  (globalThis as any).Headers = (globalThis as any).Headers || Headers;

  class RequestPolyfill {
    url: string;
    method: string;
    headers: InstanceType<typeof Headers>;
    credentials: RequestCredentials | undefined;
    private _body: Buffer;

    constructor(input: any, init: any = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = (init.method || (typeof input === 'string' ? 'GET' : input.method) || 'GET').toString();
      this.headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
      this.credentials = init.credentials || (typeof input !== 'string' ? input.credentials : undefined);
      const body = init.body || (typeof input !== 'string' ? input.body : undefined);
      if (typeof body === 'string') this._body = Buffer.from(body);
      else if (Buffer.isBuffer(body)) this._body = body;
      else this._body = Buffer.alloc(0);
    }

    clone() {
      const cloned = new RequestPolyfill(this.url, {
        method: this.method,
        headers: this.headers,
        credentials: this.credentials,
        body: this._body,
      });
      return cloned;
    }

    async arrayBuffer() {
      return this._body.buffer.slice(this._body.byteOffset, this._body.byteOffset + this._body.byteLength);
    }
  }

  class ResponsePolyfill {
    status: number;
    statusText: string;
    headers: InstanceType<typeof Headers>;
    private _body: Buffer;
    url?: string;

    constructor(body: any, init: any = {}) {
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this.headers = new Headers(init.headers || {});
      if (typeof body === 'string') this._body = Buffer.from(body);
      else if (Buffer.isBuffer(body)) this._body = body;
      else if (body == null) this._body = Buffer.alloc(0);
      else this._body = Buffer.from(String(body));
    }

    async text() {
      return this._body.toString('utf8');
    }
    async arrayBuffer() {
      return this._body.buffer.slice(this._body.byteOffset, this._body.byteOffset + this._body.byteLength);
    }

    clone() {
      const r = new ResponsePolyfill(this._body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
      r.url = this.url;
      return r;
    }
  }

  // Expose Request/Response for msw's fetch interceptor
  (globalThis as any).Request = (globalThis as any).Request || RequestPolyfill;
  (globalThis as any).Response = (globalThis as any).Response || ResponsePolyfill;

  const requestOnce = (url: string, options: any) =>
    new Promise<{ status: number; headers: Record<string, string | string[]>; body: Buffer }>((resolve, reject) => {
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? https : http;
      const req = lib.request(
        {
          protocol: u.protocol,
          hostname: u.hostname,
          port: u.port,
          path: u.pathname + u.search,
          method: (options?.method || 'GET').toString(),
          headers: options?.headers,
        },
        (res: any) => {
          const chunks: Buffer[] = [];
          res.on('data', (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
          res.on('end', () => {
            resolve({ status: res.statusCode || 0, headers: res.headers as any, body: Buffer.concat(chunks) });
          });
        }
      );
      req.on('error', reject);
      if (options?.body) req.write(options.body);
      req.end();
    });

  const fetchPolyfill = async (input: any, options: any = {}) => {
    const req = new RequestPolyfill(input, options);
    let current = req.url;
    let redirects = 0;
    const maxRedirects = 20;
    while (redirects <= maxRedirects) {
      const { status, headers, body } = await requestOnce(current, req);
      const location = (headers as any).location as string | string[] | undefined;
      if (status >= 300 && status < 400 && location) {
        const original = new URL(current);
        const next = Array.isArray(location) ? location[0] : location;
        current = new URL(next, original.origin).toString();
        redirects += 1;
        continue;
      }
      // Minimal Response-like object
      const res = new ResponsePolyfill(body, { status, headers });
      Object.defineProperty(res, 'url', { value: current, enumerable: true });
      return res as any;
    }
    throw new Error('Too many redirects');
  };

  // Attach to global
  (globalThis as any).fetch = fetchPolyfill;
};

if (typeof (globalThis as any).fetch === 'undefined') {
  definePolyfill();
}
