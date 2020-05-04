import { ActionClass, deriveMethodSignature, describeActionParameter, ActionParameter, PickledClass, VisibilityFilter, ActionMethod } from './action-elements';
import { classAmbients, methodAmbients, generalAmbients } from './ambient-symbols';
import { ActionParser, recursiveReplace } from './action-parser';
import { LoadQueue, DirectoryUtility } from './file-system-utilities';
import { logIt, LogLevel, ActionConfig } from './config';
import { CompletionItem, CompletionItemKind, CompletionParams, CancellationToken, CompletionTriggerKind, TextDocumentPositionParams, SignatureHelp, Hover, Location } from 'vscode-languageserver';

//TODO: use onigasm for regex instead
const tokenSplitter = /([\w\$]+)/g;                     //Captures symbol names
const symbolMatcher = /[\w\$]+/g;                       //Like above but non-capturing
const firstSymbolMatcher = /(^[\w\$]+)/;                //Like above but from start of string only
const ambientValidator = /(?:^|\(|\[|,)\s*[\w\$]+$/g;   //Matches strings that end with an ambient symbol; fails for sub properties – ...hopefully
const stringMatcher = /(?:".*?"|'.*?'|["'].*?$)/g;      //Matches string literals (complete or open to end of string)
const braceMatcher = /{(?:(?!{).)*?}/g;                 //Matches well paired braces
const bracketMatcher = /\[(?:(?!\[).)*?\]/g;            //Matches well paired square brackets
const matchedParens = /\((?:(?!\().)*?\)/g;             //Matches well paired parentheses
const importLineMatcher = /(\bimport\s+)([\w$\.\*]+)/;  //Finds import statements (group 1: preamble, group 2: fully qualified class)
const superclassMatcher = /(\bextends\s+)([\w$\.\*]+)/; //Finds extends statements (group 1: preamble, group 2: class - possibly fully qualified)

interface SymbolChainLink { identifier: string; called: boolean; }

export class ActionContext {
  
  private static _classes: ActionClass[] = [];
  private static _wildcardImports: { [path: string]: Promise<string[]> } = Object.create(null);
  private static _classLookup: { [fullTypeOrUri: string]: ActionClass } = Object.create(null);
  private static _intrinsicImports: { [shortType: string]: ActionClass } = Object.create(null);
  private static _globalCompletions: CompletionItem[] = [];
  private static _globalClass: ActionClass;
  
  //--Completions--//
  //---------------//
  public static async getCompletions(textDocumentPosition: CompletionParams, cancellationToken: CancellationToken): Promise<CompletionItem[]> {
    ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.VERBOSE, message: `Completion request: ${JSON.stringify(textDocumentPosition)}` });
    
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
    let returnType: string, symbolName: string, symbolCalled: boolean, isThisOrSuper: boolean, member: ActionParameter;
    let nextVisibility: VisibilityFilter = VisibilityFilter.EVERYTHING;
    try {
      for (let i = 0, l = symbolChain.length; i < l; i++) {
        symbolName = symbolChain[i].identifier;
        symbolCalled = symbolChain[i].called;
        if (!symbolCalled && i === 0 && parsedClass.shortType === symbolName) {
          nextVisibility = VisibilityFilter.ALL_STATIC;
          continue;
        }
        try {
          isThisOrSuper = symbolName === 'this' || symbolName === 'super';
          member = await nextClass.getMemberByName(symbolName, nextVisibility, i === 0 ? lineIndex : null);
          if (member.isConstructor) throw new Error('Do not want constructor');
          nextVisibility = isThisOrSuper ? VisibilityFilter.ALL_INSTANCE : VisibilityFilter.PUBLIC_INSTANCE;
          returnType = member.returnType;
          if (member.isMethod && !symbolCalled) {
            returnType = 'Function';
          }
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
        nextClass = await this.getClassByFullType(returnType, nextClass.baseUri);
        if (symbolCalled && nextClass.constructorMethod) {
          nextVisibility = VisibilityFilter.PUBLIC_INSTANCE;
        }
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
    let line = ambientClass.lines[lineIndex].substr(0, textDocumentPosition.position.character).trim();
    line = line.replace(stringMatcher, '');
    line = line.replace(braceMatcher, '');
    line = line.replace(bracketMatcher, '');
    
    let charIndex = line.length - 1, unmatchedParentheses = 1, paramIndex = 0;
    let char: string;
    while (charIndex >= 0) {
      char = line.charAt(charIndex);
      if (char === '[' || char === '{') paramIndex = 0;
      else if (char === '(') unmatchedParentheses --;
      else if (char === ')') unmatchedParentheses ++;
      else if (unmatchedParentheses === 1 && char === ',') paramIndex ++;
      if (unmatchedParentheses === 0) break;
      charIndex --;
    }
    if (unmatchedParentheses > 0) return null;
    
    let callOuter = line.substring(0, charIndex);
    callOuter = recursiveReplace(callOuter, matchedParens, '()');
    let symbolChain = this.getSymbolChainFromLine(callOuter);
    let chainLength = symbolChain.length;
    
    if (chainLength === 0) return null;
    if (symbolChain[chainLength - 1] && symbolChain[chainLength - 1].identifier === 'function') return null;
    if (symbolChain[chainLength - 2] && symbolChain[chainLength - 2].identifier === 'function') return null;
    
    let member: ActionParameter;
    if (ambientClass.superClass && chainLength === 1 && symbolChain[0].identifier === 'super') {
      let superClass = await this.getClassByFullType(ambientClass.importMap[ambientClass.superClass] || ambientClass.superClass, ambientClass.baseUri);
      member = superClass && superClass.constructorMethod;
    } else {  
      let memberAndClass = await this.traverseSymbolChainToMember(symbolChain, ambientClass, lineIndex);
      member = memberAndClass && memberAndClass[0];
    }
    
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
    
    let externalClass = await this.retrieveImportAtLine(fullLine, ambientClass, charIndex);
    if (! externalClass) externalClass = await this.retrieveSuperclassAtLine(fullLine, ambientClass, charIndex);
    if (externalClass) {
      return {
        contents: {
          language: 'actionscript',
          value: externalClass.description
        }
      };
    }
    
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
  
  public static async getDefinition(textDocumentPosition: TextDocumentPositionParams): Promise<Location> {
    ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.VERBOSE, message: `Get definition: ${JSON.stringify(textDocumentPosition)}` });
    
    let ambientClass = this._classLookup[textDocumentPosition.textDocument.uri];
    if (! ambientClass) return null;
    
    let lineIndex = textDocumentPosition.position.line;
    let charIndex = textDocumentPosition.position.character;
    let fullLine = ambientClass.lines[lineIndex];
    if (!fullLine.charAt(charIndex).match(symbolMatcher)) charIndex --;
    if (!fullLine.charAt(charIndex).match(symbolMatcher)) return null;
    
    let externalClass = await this.retrieveImportAtLine(fullLine, ambientClass, charIndex);
    if (! externalClass) externalClass = await this.retrieveSuperclassAtLine(fullLine, ambientClass, charIndex);
    if (externalClass) {
      return {
        uri: externalClass.fileUri,
        range: externalClass.locationRange
      };
    }
    
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
      if (!actionClass || !actionClass.fileUri || !actionClass.locationRange) return null;
      return {
        uri: actionClass.fileUri,
        range: actionClass.locationRange
      };
    }
    
    if (!member.owningClass || !member.owningClass.fileUri || !member.locationRange) return null;
    
    return {
      uri: member.owningClass.fileUri,
      range: member.locationRange
    };
  }
  
  private static getSymbolChainFromLine(line: string, expectGarbageAtEol?: boolean): SymbolChainLink[] {
    let tokens = line.split(tokenSplitter); //Odd-numbered array of tokens and delimiters, where the first and last elements are zero-or-longer delimiter strings
    if (expectGarbageAtEol && tokens[tokens.length - 1] !== '.') {
      tokens.pop();
      tokens.pop();
    }
    
    let token: string, delimiter: string, delimiters: string[];
    let symbolCalled: boolean = false;
    let symbolChain: SymbolChainLink[] = [];
    token_pair_loop: while (tokens.length) {
      delimiters = tokens.pop().replace(symbolMatcher, '').split('');
      delimiter_loop: while (delimiters.length) {
        delimiter = delimiters.pop();
        if (delimiter === '.') {
          continue;
        } else if (delimiter === ')') {
          symbolCalled = true;
          if (delimiters.length) {
            tokens.push(delimiters.join(''), 'crud');
          }
          this.spliceUpToMatch(tokens, ')', '(');
          break delimiter_loop;
        } else {
          break token_pair_loop;
        }
      }
      token = tokens.pop();
      token && symbolChain.unshift({ identifier: token, called: symbolCalled });
      symbolCalled = false;
    }
    return symbolChain;
  }
  
  private static retrieveImportAtLine(line: string, ambientClass: ActionClass, cursorPos: number): Thenable<ActionClass> {
    importLineMatcher.lastIndex = 0;
    let result = importLineMatcher.exec(line);
    if (!result) return null;

    let preamble = result[1], className = result[2];
    let startPos = result.index + preamble.length;
    if (cursorPos < startPos || cursorPos > startPos + className.length) return null;

    return this.getClassByFullType(className, ambientClass.baseUri);
  }
  
  private static retrieveSuperclassAtLine(line: string, ambientClass: ActionClass, cursorPos: number): Thenable<ActionClass> {
    superclassMatcher.lastIndex = 0;
    let result = superclassMatcher.exec(line);
    if (!result) return null;

    let preamble = result[1], className = result[2];
    let startPos = result.index + preamble.length;
    if (cursorPos < startPos || cursorPos > startPos + className.length) return null;

    return this.getClassByFullType(className, ambientClass.baseUri);
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
  
  private static async traverseSymbolChainToMember(symbolChain: SymbolChainLink[], ambientClass: ActionClass, lineIndex: number, preferClass?: boolean): Promise<[ActionParameter, ActionClass] | null> {
    let nextClass: ActionClass = ambientClass;
    let nextVisibility: VisibilityFilter = VisibilityFilter.EVERYTHING;
    let returnType: string, member: ActionParameter, symbolName: string, symbolCalled: boolean, isThisOrSuper: boolean, l = symbolChain.length;
    
    if (preferClass && l === 1) {
      symbolName = symbolChain[0].identifier;
      returnType = ambientClass.importMap[symbolName];
      if (returnType) {
        return [null, await this.getClassByFullType(returnType, ambientClass.baseUri)];
      } else if (this._intrinsicImports[symbolName]) {
        return [null, this._intrinsicImports[symbolName]];
      }
    }
    
    try {
      for (let i = 0; i < l; i++) {
        symbolName = symbolChain[i].identifier;
        symbolCalled = symbolChain[i].called;
        isThisOrSuper = symbolName === 'this' || symbolName === 'super';
        try {
          member = await nextClass.getMemberByName(symbolName, nextVisibility, i === 0 ? lineIndex : null);
          if (member.isConstructor) throw new Error('Do not want constructor');
          nextVisibility = isThisOrSuper ? VisibilityFilter.ALL_INSTANCE : VisibilityFilter.PUBLIC_INSTANCE;
          returnType = member.returnType;
          if (member.isMethod && !symbolCalled) {
            returnType = 'Function';
          }
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
        nextClass = await this.getClassByFullType(returnType, nextClass.baseUri);
        if (symbolCalled && nextClass.constructorMethod) {
          nextVisibility = VisibilityFilter.PUBLIC_INSTANCE;
        }
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
      let superActionClass = await this.getClassByFullType(actionClass.importMap[actionClass.superClass] || actionClass.superClass, actionClass.baseUri);
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
  
  public static getClassByFullType(fullType: string, basePath: string, forceReparse = false): Thenable<ActionClass> {
    ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.VERBOSE, message: `Request class parse! ${fullType}` });
    
    if (fullType in this._classLookup && !forceReparse) {
      return Promise.resolve(this._classLookup[fullType]);
    } else {
      let path = this.typeOrPackageToPath(fullType, basePath);
      ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.VERBOSE, message: `Type to path: ${path}` });
      let promises: [PromiseLike<any>, Promise<string>] = [ActionParser.initialise(), LoadQueue.enqueue(path)];
      return Promise.all(promises)
        .then(res => {
          if (! res) return null;
          let ac = ActionParser.parseFile(path, res[1]);
          this.registerClass(ac);
          return ac;
        })
        .catch(() => null);
    }
  }
  
  public static requestPackageParse(packageDescriptor: string, basePath: string, forceReparse = false): Promise<string[]> {
    let lookupKey = basePath + packageDescriptor;
    if (!forceReparse && lookupKey in this._wildcardImports) {
      return this._wildcardImports[lookupKey];
    }
    this._wildcardImports[lookupKey] = DirectoryUtility.fileNamesInDirectory(this.typeOrPackageToPath(packageDescriptor, basePath), /\.as$/i)
      .then(fileNames => Promise.all(fileNames.map(fileName => {
        return LoadQueue.enqueue(fileName)
          .then(contents => {
            if (! contents) return null;
            let parsedClass = ActionParser.parseFile(fileName, contents);
            this.registerClass(parsedClass);
            return parsedClass.fullType;
          });
      })));
    return this._wildcardImports[lookupKey];
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
  
  public static typeOrPackageToPath(typeDescriptor: string, basePath: string): string {
    let isPackage = this.fullTypeToShortType(typeDescriptor) === '*';
    let path = DirectoryUtility.concatPaths(basePath, DirectoryUtility.typeToPath(typeDescriptor));
    if (isPackage) {
      return path.substring(0, path.length-1);
    } else {
      return path + '.as';
    }
  }
  
}
