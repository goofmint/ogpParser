import { charsetConverter } from './charsetConverter';
import fs from 'fs';
import path from 'path';

const fixtureDirectory = path.resolve(__dirname, '../__fixture__');
const eucJP = fs.readFileSync(path.join(fixtureDirectory, 'euc_jp.html'));
const shiftJIS = fs.readFileSync(path.join(fixtureDirectory, 'shiftjis.html'));
const utf8 = fs.readFileSync(path.join(fixtureDirectory, 'utf8.html'));
const ascii = fs.readFileSync(path.join(fixtureDirectory, 'ascii.html'));

describe('charsetConverter test', () => {
  it('Check ascii', () => {
    const buf = ascii.buffer.slice(ascii.byteOffset, ascii.byteOffset + ascii.byteLength);
    const decodedText = charsetConverter(buf);
    const match = decodedText.match(/<h1>(.*?)<\/h1>/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Hello, World!');
  });
  it('Check utf8', () => {
    const buf = utf8.buffer.slice(utf8.byteOffset, utf8.byteOffset + utf8.byteLength);
    const decodedText = charsetConverter(buf);
    const match = decodedText.match(/<h1>(.*?)<\/h1>/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('こんにちは');
  });

  it('Check shift-jis', () => {
    const buf = shiftJIS.buffer.slice(shiftJIS.byteOffset, shiftJIS.byteOffset + shiftJIS.byteLength);
    const decodedText = charsetConverter(buf);
    const match = decodedText.match(/<h1>(.*?)<\/h1>/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('こんにちは');
  });

  it('Check euc_jp', () => {
    const buf = eucJP.buffer.slice(eucJP.byteOffset, eucJP.byteOffset + eucJP.byteLength);
    const decodedText = charsetConverter(buf);
    const match = decodedText.match(/<h1>(.*?)<\/h1>/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('こんにちは');
  });
});
