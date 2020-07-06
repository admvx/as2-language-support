import { logIt, LogLevel, ActionConfig, setConsole } from '../config';

let consoleSpy = jest.spyOn(console, 'log');
let defaultLogLevel = ActionConfig.LOG_LEVEL;
setConsole(console);

afterEach(() => {
  ActionConfig.LOG_LEVEL = defaultLogLevel;
  consoleSpy.mockReset();
});

test('Logs should be ignored by default', () => {
  logIt('Silenced log');
  expect(consoleSpy).not.toBeCalled();
});

test('Logs should be conveyed when enabled', () => {
  ActionConfig.LOG_LEVEL = LogLevel.VERBOSE;
  logIt('Conveyed log');
  expect(consoleSpy).toBeCalled();
});

test('Logs should fire only up to the selected log level', () => {
  ActionConfig.LOG_LEVEL = LogLevel.WARNING;
  logIt({ level: LogLevel.VERBOSE, message: 'VERBOSE' });
  logIt({ level: LogLevel.DEBUG, message: 'DEBUG' });
  expect(consoleSpy).toBeCalledTimes(1);
  
  consoleSpy.mockReset();
  ActionConfig.LOG_LEVEL = LogLevel.VERBOSE;
  logIt({ level: LogLevel.VERBOSE, message: 'VERBOSE' });
  logIt({ level: LogLevel.DEBUG, message: 'DEBUG' });
  expect(consoleSpy).toBeCalledTimes(2);
});
