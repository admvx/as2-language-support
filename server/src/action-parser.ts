import { ActionClass, ActionParameter, ActionMethod } from './action-elements';
import { logIt, LogLevel, ActionConfig } from './config';
import { ActionContext } from './action-context';
//import { loadWASM } from 'onigasm';

enum ActionScope {
  BASE = 'BASE',
  CLASS = 'CLASS'
}

const commentMatcher = new RegExp([
  /\/(\*)[^*]*\*+(?:[^*\/][^*]*\*+)*\//.source,                                       // $1: multi-line comment
  /\/(\/)[^\n]*$/.source,                                                             // $2: single-line comment
  /"(?:[^"\n\\]*|\\[\S\s])*"|'(?:[^'\n\\]*|\\[\S\s])*'/.source,                       // --- string, don't care about embedded EOLs
  /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/.source,                     // $3 (not currently used): division operator
  /\/(?=[^*\/])[^[/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[/\\]*)*?(\/)[gim]*/.source  // $4 (not currently used): last slash of regex
].join('|'), 'gm');

const stripComments = (str: string) => str.replace(commentMatcher, (match: string, mlc: string, slc: string) => {
  if (mlc) return '\n'.repeat((match.match(/\r?\n/g) || []).length);
  else return slc ? '' : match; 
});

//TODO: use onigasm for regex instead
const Patterns = {
  IMPORT: /\bimport\s+([\w$\.\*]+)/,
  CLASS: /\bclass\s+([\w$\.]+)/,
  CLASS_EXTENDS: /\bextends\s+([\w$\.]+)/,
  CLASS_VAR: /\bvar\s+([\w$]+)(?:\s*:\s*([\w$\.]+))?/,              //Group 1: var name; capture group 2 (optional): type
  PRIVATE: /\bprivate\b/,
  STATIC: /\bstatic\b/,
  METHOD: /\bfunction\s+([\w$]+)\s*\((.*)\)(?:\s*:\s*([\w$\.]+))?/, //Group 1: method name; group 2 (optional): arg list; group 3 (optional): return type
  IDENTIFIER_AND_TYPE: /\s*([\w$]+)(?:\s*:\s*([\w$\.]+))?/,         //Group 1: var/argument name; capture group 2 (optional): type
  LOCAL_VARS: /\bvar\b([\s\w$:,=.\[\]()-+*/]+)/,
  BRACES: /[{}]/g,
  MATCHED_BRACES: /{(?:(?!{).)*?}/g,
  MATCHED_BRACKETS: /\[(?:(?!\[).)*?\]/g,
  MATCHED_PARENS: /\((?:(?!\().)*?\)/g
};

export class ActionParser {
  
  private static wipClass: ActionClass;
  private static isReady: PromiseLike<any> = Promise.resolve();
  
  public static initialise(): PromiseLike<any> { return this.isReady; }  //Placeholder in case we need to initialise onigasm here
  
  public instanceTest(): void { }
  
  public static parseFile(fileUri: string, fileContent: string, deep: boolean = false): ActionClass {
    let fullType: string, shortType: string, superClass: string, result: RegExpExecArray, line: string;
    
    fileContent = stripComments(fileContent);
    
    this.wipClass = new ActionClass();
    this.wipClass.fileUri = fileUri;
    this.wipClass.lines = fileContent.split(/\r?\n/);
    
    let scopeStack: ActionScope[] = [ActionScope.BASE];
    for (let i = 0, l = this.wipClass.lines.length; i < l; i++) {
      line = this.wipClass.lines[i];
      switch (scopeStack[scopeStack.length-1]) {
        
        case ActionScope.BASE:
          //Check for imports
          Patterns.IMPORT.lastIndex = 0;
          result = Patterns.IMPORT.exec(line);
          if (result) {
            fullType = result[1];
            shortType = ActionContext.fullTypeToShortType(fullType);
            if (shortType === '*') {
              this.wipClass.registerWildcardImport(fullType);
            } else {
              this.wipClass.registerRegularImport(fullType, shortType);
            }
            break;
          }
          
          //Check for class declaration
          Patterns.CLASS.lastIndex = 0;
          result = Patterns.CLASS.exec(line);
          if (result) {
            fullType = result[1];
            shortType = ActionContext.fullTypeToShortType(fullType);
            this.wipClass.fullType = fullType;
            this.wipClass.shortType = shortType;
            this.wipClass.parentPackage = ActionContext.fullTypeToPackage(fullType);
            
            //Check for superclass
            Patterns.CLASS_EXTENDS.lastIndex = 0;
            result = Patterns.CLASS_EXTENDS.exec(line);
            if (result) {
              superClass = result[1];
              this.wipClass.superClass = this.wipClass.importMap[superClass] || superClass;
            }
            scopeStack.push(ActionScope.CLASS);
            break;
          }
          break;
          
        case ActionScope.CLASS:
          //Check for var declaration
          Patterns.CLASS_VAR.lastIndex = 0;
          result = Patterns.CLASS_VAR.exec(line);
          if (result) {
            Patterns.PRIVATE.lastIndex = Patterns.STATIC.lastIndex = 0;
            let privateRes = Patterns.PRIVATE.exec(line);
            let staticRes = Patterns.STATIC.exec(line);
            this.wipClass.registerMember({
              name: result[1],
              returnType: result[2] || undefined,
              isPublic: ! (privateRes && privateRes.index < result.index),
              isStatic: !! (staticRes && staticRes.index < result.index)
            });
            break;
          }
          
          //Check for method declaration
          Patterns.METHOD.lastIndex = 0;
          result = Patterns.METHOD.exec(line);
          if (result) {
            Patterns.PRIVATE.lastIndex = Patterns.STATIC.lastIndex = 0;
            let privateRes = Patterns.PRIVATE.exec(line);
            let staticRes = Patterns.STATIC.exec(line);
            let isConstructor = result[1] && result[1] === this.wipClass.shortType;
            
            let method: ActionMethod = {
              isMethod: true,
              isConstructor: isConstructor,
              name: result[1],
              parameters: this.getParameterArrayFromString(result[2], true),
              locals: [],
              returnType: result[3] || (isConstructor ? result[1] : null),
              isPublic: !(privateRes && privateRes.index < result.index),
              isStatic: !!(staticRes && staticRes.index < result.index),
              firstLineNumber: i + 1
            };
            
            let methodLines = this.wipClass.lines.slice(i+1);
            methodLines.unshift(line.substr(result.index + result[0].length));
            let [methodLength, locals] = this.extractMethod(methodLines, deep);
            method.lastLineNumber = method.firstLineNumber + methodLength - 1;
            method.locals = locals;
            method.scopedMembers = method.parameters.concat(method.locals);
            
            if (isConstructor) {
              this.wipClass.constructorMethod = method;
            }// else {
            this.wipClass.registerMember(method);
            // }
            
            i += methodLength;
            break;
          }
          
          break;
          
      }
    }
    this.wipClass.setupSelfReferences();
    return this.wipClass;
  }
  
  private static getParameterArrayFromString(paramString: string, isArgument = false): ActionParameter[] {
    let parsedParams: ActionParameter[] = [];
    if ((! paramString) || paramString.trim() === '') return parsedParams;
    
    let rawParams = paramString.split(',');
    let result: RegExpExecArray;
    for (let i = 0, l = rawParams.length; i < l; i++) {
      Patterns.IDENTIFIER_AND_TYPE.lastIndex = 0;
      result = Patterns.IDENTIFIER_AND_TYPE.exec(rawParams[i]);
      if (result && result[1]) {
        parsedParams.push({ name: result[1], returnType: result[2], isArgument: isArgument, isInline: ! isArgument });
      }
    }
    return parsedParams;
  }
  
  /**
   * Modifies the passed array to remove the method contents, returns an array with the local vars if desired; otherwise an empty array
   */
  private static extractMethod(lines: string[], collectLocals = false): [number, ActionParameter[]] {
    let locals: ActionParameter[] = [];
    let lineCount = -1;
    let searchCount = -1; //Denotes start not yet found
    let line: string, result: RegExpExecArray;
    
    lines: while (lines.length) {
      line = lines.shift();
      lineCount ++;
      //Find start
      if (searchCount === -1) {
        let startPos = line.indexOf('{');
        if (startPos !== -1) {
          searchCount = 1;
          if (startPos+1 < line.length) {
            lineCount --;
            lines.unshift(line.substr(startPos+1));
          }
        }
        continue;
      }
      //Find local vars
      if (collectLocals) {
        Patterns.LOCAL_VARS.lastIndex = 0;
        result = Patterns.LOCAL_VARS.exec(line);
        if (result && result[1]) {
          let localString = recursiveReplace(result[1], Patterns.MATCHED_BRACES);
          localString = recursiveReplace(localString, Patterns.MATCHED_BRACKETS);
          localString = recursiveReplace(localString, Patterns.MATCHED_PARENS);
          locals = locals.concat(this.getParameterArrayFromString(localString, false));
        }
      }
      //Find end / other opening braces
      Patterns.BRACES.lastIndex = 0;
      result = Patterns.BRACES.exec(line);
      braces: while (result) {
        searchCount += result[0] === '{' ? 1 : -1;
        if (searchCount === 0) break lines;
        result = Patterns.BRACES.exec(line);
      }
    }
    
    return [lineCount, locals];
  }
  
}

export function recursiveReplace(input: string, matcher: string | RegExp, replacement = ''): string {
  let output = input;
  do {
    input = output;
    output = input.replace(matcher, replacement);
  } while (output !== input);
  return output;
}
