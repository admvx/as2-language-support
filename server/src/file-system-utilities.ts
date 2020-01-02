import * as fse from 'fs-extra';
import * as path from 'path';
import { LogLevel, logIt, ActionConfig } from './config';

export class DirectoryUtility {

  public static fileNamesInDirectory(directoryPath: string, fileNameFilter?: RegExp, includePathInResults: boolean = true): Promise<string[]> {
    return fse.readdir(directoryPath)
      .then(fileNames => {
        if (fileNameFilter) {
          fileNames = fileNames.filter(fileName => fileName.match(fileNameFilter));
        }
        if (includePathInResults) {
          fileNames = fileNames = fileNames.map(fileName => this.concatPaths(directoryPath, fileName));
        }
        return fileNames;
      })
      .catch(err => {
        ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.ERROR, message: [`Could not load directory at '${directoryPath}'!`, err] });
        return [];
      });
  }

  public static concatPaths(start: string, end: string): string {
    return path.join(start, end);
  }

  public static typeToPath(packageIdentifier: string): string {
    return packageIdentifier.replace(/\./g, path.sep);
  }

}

export class LoadQueue {

  private static _promiseMap: { [path: string]: Promise<string> } = { };
  private static _chain: Promise<string> = Promise.resolve('');
  private static _naughtyList: { [path: string]: boolean } = { };

  public static enqueue(path: string): Promise<string> {
    if (this._naughtyList[path]) {
      return Promise.reject(`Already tried to load ${path} and failed. Aborting.`);
    }
    
    if (this._promiseMap[path]) {
      return this._promiseMap[path];
    }

    return this._promiseMap[path] = this._chain = this._chain
      .then(() => this.executeLoad(path));
  }

  private static executeLoad(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fse.readFile(path)
        .then(result => {
          this.clearQueueItem(path);
          resolve(result.toString());
        })
        .catch(err => {
          this._naughtyList[path] = true;
          this.clearQueueItem(path);
          ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.ERROR, message: [`Could not load file at: '${path}'!`, err] });
          reject(err);
        });
    });
  }

  private static clearQueueItem(path: string): void {
    this._promiseMap[path] = undefined;
  }

}

export async function loadString(path: string): Promise<string> {
  return (await fse.readFile(path)).toString();
}

export async function loadArrayBuffer(path: string): Promise<ArrayBuffer> {
  return (await fse.readFile(path)).buffer;
}