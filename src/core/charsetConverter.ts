import iconv from 'iconv-lite';
import sniffHTMLEncoding from 'html-encoding-sniffer';
const codecTypes = ['UTF-8', 'ascii', 'ISO-8859-2'] as const;

const checkShiftJis = (codec: string): string => {
  if (codec.match(/^(windows|Shift_JIS).*/i)) {
    return 'cp932';
  } else {
    return codec;
  }
};

export const charsetConverter = (buf: ArrayBuffer) => {
  const unitArray = new Uint8Array(buf);
  const detected = sniffHTMLEncoding(unitArray);
  if (codecTypes.some((codec) => detected === codec)) {
    return buf.toString();
  }
  try {
    const res = iconv.decode(Buffer.from(buf), checkShiftJis(detected));
    return res;
  } catch (e) {
    return buf.toString();
  }
};
