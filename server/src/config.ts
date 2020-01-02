export enum LogLevel {
  VERBOSE = 1,
  INFO,
  WARNING,
  ERROR,
  DEBUG,
  NONE
}

export const ActionConfig = {
  LOG_LEVEL: LogLevel.NONE
};

let logLevelToLogMethod:Map<LogLevel, Function> = new Map();
let consoleContext: any;

export function setConsole(_console: { log: Function, info: Function, warn: Function, error: Function }): void {
  logLevelToLogMethod.set(LogLevel.VERBOSE, _console.log);
  logLevelToLogMethod.set(LogLevel.INFO, _console.info);
  logLevelToLogMethod.set(LogLevel.WARNING, _console.warn);
  logLevelToLogMethod.set(LogLevel.ERROR, _console.error);
  logLevelToLogMethod.set(LogLevel.DEBUG, _console.log);
  consoleContext = _console;
}
setConsole(console);

export function logIt(logConfig: { level: LogLevel, message: any } | any, ...rest: any[]) {
  if (ActionConfig.LOG_LEVEL === LogLevel.NONE) return;
  
  let value: any = logConfig.level ? logConfig.message : Array.prototype.join.call(arguments, ' ');
  let level: LogLevel = logConfig.level || LogLevel.DEBUG;
  
  if (ActionConfig.LOG_LEVEL > level) return;
  
  if (value instanceof Array) {
    value = value.join(' ');
  }
  
  logLevelToLogMethod.get(level).call(consoleContext, value);
}
