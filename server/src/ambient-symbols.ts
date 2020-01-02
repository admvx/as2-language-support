import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';

//Keywords available in any context
export const generalAmbients: CompletionItem[] = [
  { sortText: 'zzz', kind: CompletionItemKind.Constant, label: 'NaN', documentation: 'A predefined constant with the IEEE-754 value for NaN (not a number)' },
  { sortText: 'zzz', kind: CompletionItemKind.Operator, label: 'typeof', documentation: 'Evaluates the expression and returns a String specifying whether the expression is a `String`, `MovieClip`, `Object`, `Function`, `Number`, or `Boolean` value.' },
  { sortText: 'zzz', kind: CompletionItemKind.Operator, label: 'instanceof', documentation: 'Tests whether the expression is an instance of the class constructor specified in the second position.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'null', documentation: 'A special value that can be assigned to variables or returned by a function if no data was provided.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'undefined', documentation: 'A special value, usually used to indicate that a variable has not yet been assigned a value.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'true', documentation: 'A unique Boolean value that represents the opposite of `false`.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'false', documentation: 'A unique Boolean value that represents the opposite of `true`.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'var', documentation: 'Declares a variable, optionally initializing it to a value.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'function', documentation: 'Declares a new function with the specified name, parameters and body.' }
];

//Keywords available only outside of class methods
export const classAmbients: CompletionItem[] = [
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'class', documentation: 'Declares a new class with the specified name and subsequent definition.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'import', documentation: 'Declares a reference to an external class by its fully qualified name, to be referred to within the subsequent class definition.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'extends', documentation: 'Designates a subclass to superclass relationship within a class declaration.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'private', documentation: 'Specifies that a class variable or method is hidden and inaccessible to callers external to the current class.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'public', documentation: 'Specifies that a class variable or method is visible and accessible to callers external to the current class.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'static', documentation: 'Specifies that a class variable or method exists singularly on the class object and not independently on each instance.' }
];

//Keywords available only inside class methods
export const methodAmbients: CompletionItem[] = [
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'if', documentation: 'Evaluates a condition to determine whether to run the subsequent statements.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'else', documentation: 'Specifies the statements to run if the condition in the if statement evaluates as falsey.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'for', documentation: 'Evaluates the init (initialize) expression once and then starts a looping sequence. The looping sequence begins by evaluating the condition expression. If the condition expression evaluates to true, statement is executed and the next expression is evaluated.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'in', documentation: 'Used in conjunction with `for`, this iterates over the properties of an object or the elements in an array and executes the statement for each property or element.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'while', documentation: 'Evaluates a condition and if the condition is truthy, runs a statement or series of statements before looping back to evaluate the condition again.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'continue', documentation: 'Jumps past all remaining statements in the innermost loop and starts the next iteration of the loop.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'break', documentation: 'Terminates the current loop or switch statement and transfers program control to the statement following the terminated statement.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'return', documentation: 'Ends function execution and specifies a value (if any) to be returned to the function caller.' },
  { sortText: 'zzz', kind: CompletionItemKind.Keyword, label: 'do', documentation: 'Used in conjunction with `while`, this creates a loop that executes a specified statement until the test condition evaluates as falsey.' }
];
