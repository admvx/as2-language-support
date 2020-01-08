import { ActionClass, deriveMethodSignature, describeActionParameter, ActionParameter, PickledClass, VisibilityFilter, ActionMethod } from './action-elements';
import { classAmbients, methodAmbients, generalAmbients } from './ambient-symbols';
import { ActionParser, recursiveReplace } from './action-parser';
import { LoadQueue, DirectoryUtility } from './file-system-utilities';
import { logIt, LogLevel, ActionConfig } from './config';
import { CompletionItem, CompletionItemKind, CompletionParams, CancellationToken, CompletionTriggerKind, TextDocumentPositionParams, SignatureHelp, Hover } from 'vscode-languageserver';

//TODO: use onigasm for regex instead
const tokenSplitter = /([\w\$]+)/g;                                 //Captures symbol names
const symbolMatcher = /[\w\$]+/g;                                   //Like above but non-capturing
const firstSymbolMatcher = /(^[\w\$]+)/;                            //Like above but from start of string only
const ambientValidator = /(?:^|\(|\[|,)\s*[\w\$]+$/g;               //Matches strings that end with an ambient symbol; fails for sub properties – ...hopefully
const stringMatcher = /(?:".*?"|'.*?'|["'].*?$)/g;                  //Matches string literals (complete or open to end of string)
const braceMatcher = /(?:{(?:(?!{).)*?}|{(?:(?!{).)*?$)/g;          //Matches well paired braces (complete or open to end of string)
const bracketMatcher = /(?:\[(?:(?!\[).)*?\]|\[(?:(?!\[).)*?$)/g;   //Matches well paired square brackets (complete or open to end of string)
const matchedParens = /(?:\((?:(?!\().)*?\))/g;                     //Matches well paired parentheses
const slashMatcher = /\//g;                                         //Matches forward slashes
const asExtensionMatcher = /\.as$/i;                                //Matches strings ending in .as

export class ActionContext {
  
  public static rootPath: string = '';  //TODO: Need a more accurate value for this to avoid i/o errors when the vscode folder is not the class root
  
  private static _classes: ActionClass[] = [];
  private static _classLookup: { [fullTypeOrUri: string]: ActionClass } = Object.create(null);
  private static _intrinsicImports: { [shortType: string]: ActionClass } = Object.create(null);
  private static _globalCompletions: CompletionItem[] = [];
  private static _globalClass: ActionClass;
  
  //--Completions--//
  //---------------//
  public static async getCompletions(textDocumentPosition: CompletionParams, cancellationToken: CancellationToken): Promise<CompletionItem[]> {
    ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.VERBOSE, message: `Hooray: ${JSON.stringify(textDocumentPosition)}` });
    
    let parsedClass = this._classLookup[textDocumentPosition.textDocument.uri];
    if (! parsedClass) return [];
    
    let isDotCompletion = textDocumentPosition.context.triggerKind === CompletionTriggerKind.TriggerCharacter;
    let lineIndex = textDocumentPosition.position.line;
    let line = parsedClass.lines[lineIndex].substr(0, textDocumentPosition.position.character).trim();
    
    ambientValidator.lastIndex = 0;
    if (!isDotCompletion && ambientValidator.exec(line)) {
      return this.getInnerSymbols(parsedClass, VisibilityFilter.EVERYTHING, textDocumentPosition);
    }
    
    let symbolChain = this.getSymbolChainFromLine(line, !isDotCompletion);
    
    ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.VERBOSE, message: '---\n' + symbolChain });
    if (! symbolChain.length) return this.getInnerSymbols(parsedClass, VisibilityFilter.EVERYTHING, textDocumentPosition);
    
    let nextClass: ActionClass = parsedClass;
    let returnType: string, symbolName: string, isThisOrSuper: boolean, member: ActionParameter;
    let nextVisibility: VisibilityFilter = VisibilityFilter.EVERYTHING;
    try {
      for (let i = 0, l = symbolChain.length; i < l; i++) {
        symbolName = symbolChain[i];
        if (i === 0 && nextClass.shortType === symbolName) {
          nextVisibility = VisibilityFilter.ALL_STATIC;
          continue;
        }
        try {
          isThisOrSuper = symbolName === 'this' || symbolName === 'super';
          member = await nextClass.getMemberByName(symbolName, nextVisibility, i === 0 ? lineIndex : null);
          if (member.isConstructor) throw new Error('Do not want constructor');
          returnType = member.returnType;
          nextVisibility = isThisOrSuper ? VisibilityFilter.ALL_INSTANCE : VisibilityFilter.PUBLIC_INSTANCE;
        } catch {
          if (i === 0) {
            try {
              returnType = (await this._globalClass.getMemberByName(symbolName, VisibilityFilter.EVERYTHING)).returnType;
              nextVisibility = VisibilityFilter.PUBLIC_INSTANCE;
            } catch {
              returnType = symbolName;
              nextVisibility = VisibilityFilter.PUBLIC_STATIC;
            }
          } else {
            return [];
          }
        }
        returnType = nextClass.importMap[returnType] || returnType;
        nextClass = await this.getClassByFullType(returnType);
      }
    } catch (e) { return []; }
    
    if (! nextClass) return [];
    return this.getInnerSymbols(nextClass, nextVisibility, null, isThisOrSuper);
  }
  
  public static async getSignatureHelp(textDocumentPosition: TextDocumentPositionParams, token: CancellationToken): Promise<SignatureHelp> {
    ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.VERBOSE, message: `Signature help: ${JSON.stringify(textDocumentPosition)}` });
    
    let ambientClass = this._classLookup[textDocumentPosition.textDocument.uri];
    if (! ambientClass) return null;
    
    let lineIndex = textDocumentPosition.position.line;
    let line = ambientClass.lines[lineIndex].substr(0, textDocumentPosition.position.character).trim().replace(stringMatcher, '');
    line = recursiveReplace(line, matchedParens);
    let callBoundary = line.lastIndexOf('(');
    if (callBoundary === -1) return null;
    
    let callOuter = line.substr(0, callBoundary);
    let callInner = line.substr(callBoundary);
    callInner = recursiveReplace(callInner, braceMatcher);
    callInner = recursiveReplace(callInner, bracketMatcher);
    let paramIndex = callInner.split(',').length - 1;
    let symbolChain = this.getSymbolChainFromLine(callOuter);
    
    if (symbolChain.length === 0 || symbolChain[symbolChain.length - 1] === 'function' || symbolChain[symbolChain.length - 2] === 'function') return null;
    
    let memberAndClass = await this.traverseSymbolChainToMember(symbolChain, ambientClass, lineIndex);
    let member = memberAndClass && memberAndClass[0];
    
    if (! (member && member.isMethod)) return null;
    let method = <ActionMethod>member;
    method.lspSignature = method.lspSignature || deriveMethodSignature(method);
    
    return {
      signatures: [method.lspSignature],
      activeSignature: 0,
      activeParameter: paramIndex
    };
  }
  
  public static async getHoverInfo(textDocumentPosition: TextDocumentPositionParams): Promise<Hover> {
    ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.VERBOSE, message: `Hover info: ${JSON.stringify(textDocumentPosition)}` });
    
    let ambientClass = this._classLookup[textDocumentPosition.textDocument.uri];
    if (! ambientClass) return null;
    
    let lineIndex = textDocumentPosition.position.line;
    let charIndex = textDocumentPosition.position.character;
    let fullLine = ambientClass.lines[lineIndex];
    if (!fullLine.charAt(charIndex).match(symbolMatcher)) return null;
    
    let line = fullLine.substr(0, charIndex + 1).trim();
    if (this.positionInsideStringLiteral(line)) return null;
    
    firstSymbolMatcher.lastIndex = 0;
    let result = firstSymbolMatcher.exec(fullLine.substr(charIndex + 1));
    if (result) {
      line += result[1];
    }
    
    let symbolChain = this.getSymbolChainFromLine(line);
    let memberAndClass = await this.traverseSymbolChainToMember(symbolChain, ambientClass, lineIndex, true);
    let member = memberAndClass && memberAndClass[0];
    let actionClass = memberAndClass && memberAndClass[1];
    if (! member) {
      if (! actionClass) return null;
      return {
        contents: {
          language: 'actionscript',
          value: actionClass.description
        }
      };
    }
    
    member.description = member.description || describeActionParameter(member);
    
    return {
      contents: {
        language: 'actionscript',
        value: member.description
      }
    };
  }
  
  private static getSymbolChainFromLine(line: string, expectGarbageAtEol?: boolean): string[] {
    let tokens = line.split(tokenSplitter); //Odd-numbered array of tokens and delimiters, where the first and last elements are zero-or-longer delimiter strings
    if (expectGarbageAtEol && tokens[tokens.length - 1] !== '.') {
      tokens.pop();
      tokens.pop();
    }
    
    let token: string, delimiter: string, delimiters: string[];
    let symbolChain: string[] = [];
    token_pair_loop: while (tokens.length) {
      delimiters = tokens.pop().replace(symbolMatcher, '').split('');
      delimiter_loop: while (delimiters.length) {
        delimiter = delimiters.pop();
        if (delimiter === '.') {
          continue;
        } else if (delimiter === ')') {
          if (delimiters.length) {
            tokens.push(delimiters.join(''), 'crud');
          }
          this.spliceUpToMatch(tokens, ')', '('); //Consider adding the next symbol and flagging it as called rather than accessed directly
          break delimiter_loop;
        } else {
          break token_pair_loop;
        }
      }
      token = tokens.pop();
      token && symbolChain.unshift(token);
    }
    return symbolChain;
  }

  private static spliceUpToMatch(tokens: string[], triggerChar: String, matchChar: String): void {
    let searchCount = 1;
    let delimiter: string, delimiters: string[];
    while (tokens.length && searchCount > 0) {
      tokens.pop(); //Burn non-delimiter token
      delimiters = tokens.pop().replace(symbolMatcher, '').split('');
      while (delimiters.length) {
        delimiter = delimiters.pop();
        if (delimiter === triggerChar) {
          searchCount ++;
        } else if (delimiter === matchChar) {
          searchCount --;
        }
      }
    }
    //Consider special handling of cases where the matching character was found but there's still stuff remaining in the current delimiter that we may not want to lose - e.g. another opening bracket
  }
  
  private static async traverseSymbolChainToMember(symbolChain: string[], ambientClass: ActionClass, lineIndex: number, preferClass?: boolean): Promise<[ActionParameter, ActionClass] | null> {
    let nextClass: ActionClass = ambientClass;
    let nextVisibility: VisibilityFilter = VisibilityFilter.EVERYTHING;
    let returnType: string, member: ActionParameter, symbolName: string, isThisOrSuper: boolean, l = symbolChain.length;
    
    if (preferClass && l === 1) {
      symbolName = symbolChain[0];
      returnType = ambientClass.importMap[symbolName];
      if (returnType) {
        return [null, await this.getClassByFullType(returnType)];
      } else if (this._intrinsicImports[symbolName]) {
        return [null, this._intrinsicImports[symbolName]];
      }
    }
    
    try {
      for (let i = 0; i < l; i++) {
        try {
          symbolName = symbolChain[i];
          isThisOrSuper = symbolName === 'this' || symbolName === 'super';
          member = await nextClass.getMemberByName(symbolName, nextVisibility, i === 0 ? lineIndex : null);
          if (member.isConstructor) throw new Error('Do not want constructor');
          nextVisibility = isThisOrSuper ? VisibilityFilter.ALL_INSTANCE : VisibilityFilter.PUBLIC_INSTANCE;
          returnType = member.returnType;
          if (i === l - 1) {
            break;
          }
        } catch {
          if (i === 0) {
            try {
              member = await this._globalClass.getMemberByName(symbolName, VisibilityFilter.EVERYTHING);
              nextVisibility = VisibilityFilter.PUBLIC_INSTANCE;
              returnType = member.returnType;
              if (i === l - 1) {
                break;
              }
            } catch {
              returnType = symbolName;
              nextVisibility = VisibilityFilter.PUBLIC_STATIC;
            }
          } else {
            return null;
          }
        }
        returnType = nextClass.importMap[returnType] || returnType;
        nextClass = await this.getClassByFullType(returnType);
      }
    } catch { return null; }
    
    if (! member) {
      if (nextClass && nextClass.constructorMethod) {
        member = nextClass.constructorMethod;
      } else {
        return null;
      }
    }
    
    return [member, nextClass];
  }
  
  private static async getInnerSymbols(actionClass: ActionClass, visibilityFilter: VisibilityFilter, textDocumentPosition?: TextDocumentPositionParams, isThisOrSuper?: boolean, skipMap?: {[name: string]: boolean}, rank?: number): Promise<CompletionItem[]> {
    ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.VERBOSE, message: `getAmbientSymbols: ${actionClass.shortType}, vis: ${visibilityFilter}, isThisOrSuper: ${isThisOrSuper}` });
    
    if (! skipMap) {
      skipMap = Object.create(null);
      if (isThisOrSuper) {
        skipMap.this = skipMap.super = skipMap[actionClass.shortType] = true;
      }
    }
    
    rank = rank || 0;
    rank ++;
    let rankString = ('0' + rank).substr(-2);
    
    let completionItems: CompletionItem[] = [];
    let sourceMembers: ActionParameter[] = textDocumentPosition && actionClass.getScopedMembersAt(textDocumentPosition.position.line) || [];
    let numLocals = sourceMembers.length;
    
    let newSymbols: ActionParameter[];
    switch (visibilityFilter) {
      case VisibilityFilter.PUBLIC_INSTANCE:
        newSymbols = actionClass.publicMembers;
        break;
      case VisibilityFilter.ALL_INSTANCE:
        newSymbols = actionClass.instanceMembers;
        break;
      case VisibilityFilter.ALL_STATIC:
        newSymbols = actionClass.staticMembers;
        break;
      case VisibilityFilter.PUBLIC_STATIC:
        newSymbols = actionClass.publicStaticMembers;
        break;
      case VisibilityFilter.EVERYTHING:
        newSymbols = actionClass.members;
        break;
    }
    sourceMembers = sourceMembers.concat(newSymbols || []);
    
    sourceMembers.forEach(member => {
      if (skipMap[member.name] || member.isConstructor) return;
      skipMap[member.name] = true;
      member.description = member.description || describeActionParameter(member);
      completionItems.push({
        label: member.name,
        kind: member.isMethod ? CompletionItemKind.Method : (member.name === 'this' || member.name === 'super' ? CompletionItemKind.Keyword : (member.isArgument || member.isInline ? CompletionItemKind.Variable : CompletionItemKind.Property)),
        detail: member.description,
        documentation: member.documentation,
        sortText: rankString + member.name
      });
      if (numLocals && completionItems.length === numLocals) {
        rank ++;
        rankString = ('0' + rank).substr(-2);
      }
    });
    
    if (visibilityFilter === VisibilityFilter.EVERYTHING && !! textDocumentPosition) {
      let imports = actionClass.importMap;
      for (let short in imports) {
        completionItems.push({
          label: short,
          kind: CompletionItemKind.Class,
          detail: (actionClass.fullType === imports[short] ? '(class) ' : '(import) ') + imports[short],
          sortText: rankString + short
        });
      }
    }
    
    if (actionClass.superClass) {
      let superActionClass = await this.getClassByFullType(actionClass.superClass);
      if (superActionClass) {
        completionItems = completionItems.concat(await this.getInnerSymbols(superActionClass, visibilityFilter, null, false, skipMap, rank));
      }
    }
    
    if (textDocumentPosition) {
      completionItems = completionItems.concat(generalAmbients, this._globalCompletions);
      if (actionClass.lineInMethod(textDocumentPosition.position.line)) {
        completionItems = completionItems.concat(methodAmbients);
      } else {
        completionItems = completionItems.concat(classAmbients);
      }
    }
    
    return completionItems;
  }
  
  private static positionInsideStringLiteral(line: string, position?: number): boolean {
    position = position || line.length;
    let inString = false;
    let char: string, lookingFor: string;
    for (let i = 0; i < position; i++) {
      char = line.charAt(i);
      if (inString) {
        if (char === lookingFor) {
          inString = false;
        } else if (char === '\\') {
          i ++;
        }
      } else if (char === '\'' || char === '"') {
        inString = true;
        lookingFor = char;
      }
    }
    return inString;
  }
  
  //--Parsing--//
  //-----------//
  public static loadPickles(pickles: PickledClass[]): void {
    pickles.forEach(pickle => {
      let actionClass = ActionClass.fromPickle(pickle, true);
      if (actionClass.fullType === '_global') {
        this.getInnerSymbols(actionClass, VisibilityFilter.EVERYTHING, null, true, null, 98)
          .then(completions => this._globalCompletions = this._globalCompletions.concat(completions));
        this._globalClass = actionClass;
      } else {
        this.registerClass(actionClass);
        this._globalCompletions.push({
          label: actionClass.shortType,
          detail: '(intrinsic class) ' + actionClass.fullType,
          kind: CompletionItemKind.Class
        });
        this._intrinsicImports[actionClass.shortType] = actionClass;
      }
    });
  }
  
  public static hasBeenParsed(uriOrFullType: string): boolean {
    return !! this._classLookup[uriOrFullType];
  }
  
  public static registerClass(actionClass: ActionClass): void {
    if (! actionClass.fullType) {
      ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.WARNING, message: `No type supplied! Not enough data to register class!` });
      return;
    }
    if (this._classLookup[actionClass.fullType]) {
      ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.WARNING, message: ['Type already registered:', actionClass.shortType, '|', actionClass.fullType, '! Replacing previous...']});
      this._classes.splice(this._classes.indexOf(this._classLookup[actionClass.fullType]), 1, actionClass);
    } else {
      this._classes.push(actionClass);
    }
    this._classLookup[actionClass.fullType] = actionClass;
    this._classLookup[actionClass.fileUri] = actionClass;
  }
  
  public static getClassByFullType(fullType: string): Thenable<ActionClass> {
    if (! fullType) {
      return Promise.resolve(null);
    }
    if (this._classLookup[fullType]) {
      return Promise.resolve(this._classLookup[fullType]);
    }
    return this.requestClassParse(fullType);
  }
  
  public static requestClassParse(fullType: string, forceReparse: boolean = false): Thenable<ActionClass> {
    ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.INFO, message: `request class parse! ${fullType}` });
    
    if (fullType in this._classLookup && !forceReparse) {
      return Promise.resolve(this._classLookup[fullType]);
    } else {
      let path = this.typeOrPackageToPath(fullType);
      ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.INFO, message: `Type to path: ${path}` });
      let promises: [PromiseLike<any>, Promise<string>] = [ActionParser.initialise(), LoadQueue.enqueue(path)];
      return Promise.all(promises)
        .then(res => {
          let ac = ActionParser.parseFile(path, res[1]);
          this.registerClass(ac);
          return ac;
        })
        .catch(() => null);
    }
  }
  
  public static requestPackageParse(packageDescriptor: string, forceReparse: boolean = false): Promise<string[]> {
    return DirectoryUtility.fileNamesInDirectory(this.typeOrPackageToPath(packageDescriptor), /\.as$/i)
      .then(fileNames => fileNames.map(fileName => {
        let fullType = this.pathToFullType(fileName);
        if (fullType && (forceReparse || !this._classLookup[fullType])) {
          let path = this.typeOrPackageToPath(fullType);
          LoadQueue.enqueue(path)
            .then(contents => this.registerClass(ActionParser.parseFile(path, contents)))
            .catch(e => ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.ERROR, message: `Load error! ${path} ${e}` }));
        }
        return fullType;
      }));
  }
  
  public static fullTypeToPackage(fullType: string): string {
    return fullType.substring(0, fullType.lastIndexOf('.'));
  }
  
  public static fullTypeToShortType(fullType: string): string {
    return fullType.substring(fullType.lastIndexOf('.') + 1);
  }
  
  public static mightBeShortType(rawType: string): boolean {
    return rawType.indexOf('.') === -1;
  }
  
  public static typeOrPackageToPath(typeDescriptor: string): string {
    let isPackage = this.fullTypeToShortType(typeDescriptor) === '*';
    let path = DirectoryUtility.concatPaths(this.rootPath, DirectoryUtility.typeToPath(typeDescriptor));
    if (isPackage) {
      return path.substring(0, path.length-1);
    } else {
      return path + '.as';
    }
  }
  
  public static pathToFullType(path: string): string {
    if (path.indexOf(this.rootPath) !== 0) {
      ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.WARNING, message: `Can't determine type from path: '${path}' as it does not begin with the current rootPath: '${this.rootPath}'!` });
      return '';
    }
    if (path.substr(-3).toLowerCase() !== '.as') {
      ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.WARNING, message: `Unexpected file extension in path '${path}'!` });
      return '';
    }
    return path.substring(this.rootPath.length).replace(slashMatcher, '.').replace(asExtensionMatcher, '');
  }
  
}
