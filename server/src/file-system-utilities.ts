import * as fse from 'fs-extra';
import { URI } from 'vscode-uri';
import { LogLevel, logIt, ActionConfig } from './config';

export class DirectoryUtility {

  public static fileNamesInDirectory(directoryPath: string, fileNameFilter?: RegExp, includePathInResults: boolean = true, pathIsUri: boolean = true): Promise<string[]> {
    directoryPath = pathIsUri ? URI.parse(directoryPath).fsPath : directoryPath;
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
    return start + '/' + end;
  }

  public static typeToPath(packageIdentifier: string): string {
    return packageIdentifier.replace(/\./g, '/');
  }
  
  public static fileUriAndTypeToBaseUri(fileUri: string, fullType: string): string {
    if (!fileUri || !fullType) return '';
    
    let packageDepth = fullType.split('.').length;
    let lastFoundIndex: number, directoriesPopped = 0;
    
    while (directoriesPopped < packageDepth && lastFoundIndex !== -1) {
      lastFoundIndex = fileUri.lastIndexOf('/', lastFoundIndex - 1);
      directoriesPopped ++;
    }
    if (lastFoundIndex === undefined || lastFoundIndex === -1 || directoriesPopped < packageDepth) return '';
    
    return fileUri.substr(0, lastFoundIndex);
  }

}

export class LoadQueue {

  private static _promiseMap: { [path: string]: Promise<string> } = { };
  private static _chain: Promise<string> = Promise.resolve('');
  private static _naughtyList: { [path: string]: boolean } = { };

  public static enqueue(filePath: string, pathIsUri: boolean = true): Promise<string> {
    filePath = pathIsUri ? URI.parse(filePath).fsPath : filePath;
    
    if (this._naughtyList[filePath]) {
      ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.WARNING, message: `Already tried to load ${filePath} and failed. Aborting.` });
      return Promise.resolve(null);
    }
    
    if (this._promiseMap[filePath]) {
      return this._promiseMap[filePath];
    }
    
    return this._promiseMap[filePath] = this._chain = this._chain
      .then(() => this.executeLoad(filePath));
  }
  
  private static executeLoad(path: string): Promise<string> {
    return fse.readFile(path)
      .then(result => {
        this.clearQueueItem(path);
        return result.toString();
      })
      .catch(err => {
        this._naughtyList[path] = true;
        this.clearQueueItem(path);
        ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.ERROR, message: [`Could not load file at: '${path}'!`, err] });
        return null;
      });
  }
  
  private static clearQueueItem(path: string): void {
    delete this._promiseMap[path];
  }
  
}

export async function loadString(path: string): Promise<string> {
  return (await fse.readFile(path)).toString();
}

export async function loadArrayBuffer(path: string): Promise<ArrayBuffer> {
  return (await fse.readFile(path)).buffer;
}