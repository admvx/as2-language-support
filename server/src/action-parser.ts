import { ActionClass, ActionParameter, ActionMethod } from './action-elements';
import { logIt, LogLevel, ActionConfig } from './config';
import { ActionContext } from './action-context';
import { Range } from 'vscode-languageserver';
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
  CLASS: /(\bclass\s+)([\w$\.]+)/,
  CLASS_EXTENDS: /\bextends\s+([\w$\.]+)/,
  CLASS_VAR: /(\bvar\s+)([\w$]+)(?:\s*:\s*([\w$\.]+))?/,                //Group 2: var name; group 3 (optional): type
  PRIVATE: /\bprivate\b/,
  STATIC: /\bstatic\b/,
  METHOD: /(\bfunction\s+)([\w$]+)(\s*\()(.*)\)(?:\s*:\s*([\w$\.]+))?/, //Group 2: method name; group 4 (optional): arg list; group 5 (optional): return type
  IDENTIFIER_AND_TYPE: /(\s*)([\w$]+)(\s*)(?:\:\s*([\w$\.]+)\s*)?/,     //Group 2: var/argument name; group 4 (optional): type
  LOCAL_VARS: /(\bvar\b)([\s\w$:,=.\[\]()-+*/]+)/,                      //Group 2: content
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
    
    let includeLocations: boolean = !! fileUri;
    let imports: string[] = [];
    
    let scopeStack: ActionScope[] = [ActionScope.BASE];
    for (let i = 0, l = this.wipClass.lines.length; i < l; i++) {
      line = this.wipClass.lines[i];
      switch (scopeStack[scopeStack.length-1]) {
        
        case ActionScope.BASE:
          //Check for imports
          Patterns.IMPORT.lastIndex = 0;
          result = Patterns.IMPORT.exec(line);
          if (result) {
            imports.push(result[1]);
            break;
          }
          
          //Check for class declaration
          Patterns.CLASS.lastIndex = 0;
          result = Patterns.CLASS.exec(line);
          if (result) {
            fullType = result[2];
            if (includeLocations) {
              let charStart = result.index + result[1].length;
              this.wipClass.locationRange = { start: { line: i, character: charStart }, end: { line: i, character: charStart + result[2].length } };
            }
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
            let member: ActionParameter = {
              name: result[2],
              returnType: result[3] || undefined,
              isPublic: ! (privateRes && privateRes.index < result.index),
              isStatic: !! (staticRes && staticRes.index < result.index),
              owningClass: this.wipClass
            };
            if (includeLocations) {
              let charStart = result.index + result[1].length;
              member.locationRange = { start: { line: i, character: charStart }, end: { line: i, character: charStart + result[2].length } };
            }
            this.wipClass.registerMember(member);
            break;
          }
          
          //Check for method declaration
          Patterns.METHOD.lastIndex = 0;
          result = Patterns.METHOD.exec(line);
          if (result) {
            Patterns.PRIVATE.lastIndex = Patterns.STATIC.lastIndex = 0;
            let privateRes = Patterns.PRIVATE.exec(line);
            let staticRes = Patterns.STATIC.exec(line);
            let isConstructor = result[2] && result[2] === this.wipClass.shortType;
            
            let locationRange: Range, argsStart: number;
            if (includeLocations) {
              let charStart = result.index + result[1].length;
              locationRange = { start: { line: i, character: charStart }, end: { line: i, character: charStart + result[2].length } };
              argsStart = locationRange.end.character + result[3].length;
            }
            
            let method: ActionMethod = {
              isMethod: true,
              isConstructor: isConstructor,
              name: result[2],
              parameters: this.getParameterArrayFromString(result[4], true, includeLocations, i, argsStart),
              locationRange: locationRange,
              locals: [],
              returnType: result[5] || (isConstructor ? result[2] : null),
              isPublic: !(privateRes && privateRes.index < result.index),
              isStatic: !!(staticRes && staticRes.index < result.index),
              owningClass: this.wipClass
            };
            
            let methodLines = this.wipClass.lines.slice(i+1);
            methodLines.unshift(line.substr(result.index + result[0].length));
            let [methodLength, locals] = this.extractMethod(methodLines, deep, includeLocations, i);
            if (includeLocations) {
              method.firstLineNumber = i + 1;
              method.lastLineNumber = method.firstLineNumber + methodLength - 1;
            }
            method.locals = locals;
            method.scopedMembers = method.parameters.concat(method.locals);
            
            if (isConstructor) {
              this.wipClass.constructorMethod = method;
            }
            this.wipClass.registerMember(method);
            
            i += methodLength;
            break;
          }
          
          break;
      }
    }
    
    this.wipClass.setupSelfReferences();
    
    //Register imports and parse external files
    imports.forEach(fullType => {
      shortType = ActionContext.fullTypeToShortType(fullType);
      if (shortType === '*') {
        this.wipClass.registerWildcardImport(fullType);
      } else {
        this.wipClass.registerRegularImport(fullType, shortType);
      }
    });
    
    return this.wipClass;
  }
  
  private static getParameterArrayFromString(paramString: string, isArgument = false, includeLocations = false, lineNumber?: number, charIndex?: number): ActionParameter[] {
    let parsedParams: ActionParameter[] = [];
    if ((! paramString) || paramString.trim() === '') return parsedParams;
    
    let rawParams = paramString.split(','), charStart: number;
    let result: RegExpExecArray;
    for (let i = 0, l = rawParams.length; i < l; i++) {
      Patterns.IDENTIFIER_AND_TYPE.lastIndex = 0; 
      result = Patterns.IDENTIFIER_AND_TYPE.exec(rawParams[i]);
      if (result && result[2]) {
        let param: ActionParameter = { name: result[2], returnType: result[4], isArgument: isArgument, isInline: ! isArgument };
        if (includeLocations) {
          charStart = charIndex + result.index + result[1].length;
          param.locationRange = { start: { line: lineNumber, character: charStart }, end: { line: lineNumber, character: charStart + result[2].length } };
          param.owningClass = this.wipClass;
          charIndex += rawParams[i].length + 1;
        }
        parsedParams.push(param);
      }
    }
    return parsedParams;
  }
  
  /**
   * Modifies the passed array to remove the method contents, returns an array with the local vars if desired; otherwise an empty array
   */
  private static extractMethod(lines: string[], collectLocals = false, includeLocations = false, lineNumber?: number): [number, ActionParameter[]] {
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
        if (result && result[2]) {
          let localString = recursiveReplaceAndPreserveLength(result[2], Patterns.MATCHED_BRACES);
          localString = recursiveReplaceAndPreserveLength(localString, Patterns.MATCHED_BRACKETS);
          localString = recursiveReplaceAndPreserveLength(localString, Patterns.MATCHED_PARENS);
          locals = locals.concat(this.getParameterArrayFromString(localString, false, includeLocations, lineNumber + lineCount, result.index + result[1].length));
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

export function recursiveReplaceAndPreserveLength(input: string, matcher: RegExp, replacement = ' '): string {
  let output = input;
  let result: RegExpExecArray;
  do {
    input = output;
    matcher.lastIndex = 0;
    result = matcher.exec(input);
    if (! result || !result[0]) break;
    output = input.replace(result[0], replacement.repeat(result[0].length));
  } while (output !== input);
  return output;
}
