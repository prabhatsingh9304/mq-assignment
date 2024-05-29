import * as path from 'path';
import checkFileExists from "./checkFileExists";

describe('checkFileExists', () => {
  it('should return true if file exists', async () => {
    await expect(checkFileExists(path.join(__dirname, "../main.ts"))).resolves.toBe(true);
  });
  it('should return false if file does not exists', async () => {
    await expect(checkFileExists(path.join(__dirname, "../main2.ts"))).resolves.toBe(false);
  });
});