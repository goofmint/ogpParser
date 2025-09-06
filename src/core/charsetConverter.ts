import iconv from 'iconv-lite';
import sniffHTMLEncoding from 'html-encoding-sniffer';

const passThroughCodecs = ['UTF-8', 'ascii'] as const;

const checkShiftJis = (codec: string): string => {
  if (/^(windows|Shift_JIS).*/i.test(codec)) {
    return 'cp932';
  }
  return codec;
};

export const charsetConverter = (buf: ArrayBuffer | string): string => {
  if (typeof buf === 'string') return buf;

  const unitArray = new Uint8Array(buf);
  const detected = sniffHTMLEncoding(unitArray);

  try {
    if (passThroughCodecs.includes(detected as any)) {
      const enc = detected.toLowerCase() === 'utf-8' ? 'utf8' : 'ascii';
      return Buffer.from(unitArray).toString(enc);
    }
    // Fallback to iconv-lite for non-UTF8/ascii (e.g., Shift_JIS, EUC-JP, etc.)
    return iconv.decode(Buffer.from(unitArray), checkShiftJis(detected));
  } catch (_) {
    // Last resort: best-effort UTF-8
    return Buffer.from(unitArray).toString('utf8');
  }
};
