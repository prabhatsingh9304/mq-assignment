import * as fs from 'fs';

async function checkFileExists(file) {
  try {
    await fs.promises.access(file, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export default checkFileExists;
