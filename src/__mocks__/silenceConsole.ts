// Silence noisy network error logs from MSW's fetch interceptor during tests.
// We still want other console.error messages to show up.

const originalError = console.error;

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    const first = args[0];
    if (typeof first === 'string' && first.includes('net::ERR_FAILED')) {
      // ignore msw interceptors fetch error logs that are expected in tests
      return;
    }
    // pass through anything else
    originalError(...args);
  });
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

