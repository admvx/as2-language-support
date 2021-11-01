import { ActionContext } from './action-context';
import { logIt, LogLevel, ActionConfig } from './config';
import { SignatureInformation, Range, DocumentSymbol, SymbolKind } from 'vscode-languageserver';
import { DirectoryUtility } from './file-system-utilities';

export class ActionClass {
  
  public shortType: string;
  public fullType: string;
  public fileUri: string;
  public baseUri: string;
  public isIntrinsic: boolean;
  public superClass: string;
  public parentPackage: string;
  public lines: string[];
  public constructorMethod: ActionMethod;
  public locationRange: Range;
  public fullRange: Range;
  
  private _description: string;
  private _memberLookup: { [propName: string]: ActionParameter } = Object.create(null);
  private _instanceMemberLookup: { [propName: string]: ActionParameter } = Object.create(null);
  private _publicInstanceMemberLookup: { [propName: string]: ActionParameter } = Object.create(null);
  private _publicStaticMemberLookup: { [propName: string]: ActionParameter } = Object.create(null);
  private _staticMemberLookup: { [propName: string]: ActionParameter } = Object.create(null);
  private _importMap: { [shortType: string]: string } = Object.create(null);
  private _symbolChildren: DocumentSymbol[] = [];
  private _symbolTree: DocumentSymbol;
  private _imports: string[] = [];
  private _wildcardImports: string[] = [];
  private _members: ActionParameter[] = [];
  private _methods: ActionMethod[] = [];
  private _instanceMembers: ActionParameter[] = [];
  private _publicInstanceMembers: ActionParameter[] = [];
  private _publicStaticMembers: ActionParameter[] = [];
  private _staticMembers: ActionParameter[] = [];
  private _lineToMethodLookup: ActionMethod[] = [];
  
  public registerMember(member: ActionParameter): void {
    if (! (member.name in this._memberLookup)) {
      this._members.push(member);
      this._memberLookup[member.name] = member;
      if (member.isPublic && ! member.isConstructor) {
        if (member.isStatic) {
          this._publicStaticMembers.push(member);
          this._publicStaticMemberLookup[member.name] = member;
        } else {
          this._publicInstanceMembers.push(member);
          this._publicInstanceMemberLookup[member.name] = member;
        }
      }
      if (member.isStatic) {
        this._staticMembers.push(member);
        this._staticMemberLookup[member.name] = member;
      } else {
        this._instanceMembers.push(member);
        this._instanceMemberLookup[member.name] = member;
      }
      if (member.isMethod) {
        let method = <ActionMethod>member;
        this._methods.push(method);
      }
    } else {
      //Consider replacing the existing member in the case of partial updates
      ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.VERBOSE, message: `Member ${member.name}, already registered on ${this.shortType}!` });
    }
  }
  
  public registerRegularImport(fullType: string, shortType?: string, skipParse?: boolean): void {
    shortType = shortType || ActionContext.fullTypeToShortType(fullType);
    this._imports.push(fullType);
    this._importMap[shortType] = fullType;
    if (! skipParse) {
      ActionContext.getClassByFullType(fullType, this.baseUri, false);
    }
  }
  
  public registerWildcardImport(wildcardImport: string): void {
    this._wildcardImports.push(wildcardImport);
    ActionContext.requestPackageParse(wildcardImport, this.baseUri, false)
      .then(packageMembers => packageMembers.forEach(importType => {
        if (importType && importType !== this.fullType) {
          this.registerRegularImport(importType, null, true);
        }
      }));
  }
  
  public getMemberByName(memberName: string, filter: VisibilityFilter = VisibilityFilter.PUBLIC_INSTANCE, lineNumber: number = null): PromiseLike<[ActionParameter, ActionClass]> {
    if (lineNumber !== null) {
      let method = this.getMethodAt(lineNumber);
      if (method) {
        for (let i = 0, l = method.scopedMembers.length; i < l; i++) {
          ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.WARNING, message: `Comparing ${method.scopedMembers[i].name} to ${memberName}` });
          if (memberName === method.scopedMembers[i].name) return Promise.resolve([method.scopedMembers[i], this]);
        }
      }
    }
    
    let lookup: { [propName: string]: ActionParameter };
    switch (filter) {
      case VisibilityFilter.PUBLIC_INSTANCE:
        lookup = this._publicInstanceMemberLookup;
        break;
      case VisibilityFilter.PUBLIC_STATIC:
        lookup = this._publicStaticMemberLookup;
        break;
      case VisibilityFilter.ALL_STATIC:
        lookup = this._staticMemberLookup;
        break;
      case VisibilityFilter.EVERYTHING:
      default:
        lookup = this._memberLookup;
        break;
    }
    if (lookup[memberName]) {
      return Promise.resolve([lookup[memberName], this]);
    } else if (this.superClass) {
      return ActionContext.getClassByFullType(this.importMap[this.superClass] || this.superClass, this.baseUri, false)
        .then(parsedSuperClass => parsedSuperClass && parsedSuperClass.getMemberByName(memberName, filter));
    }
    return null;
  }
  
  public getMethodAt(lineNumber: number): ActionMethod | null {
    if (this._lineToMethodLookup[lineNumber]) return this._lineToMethodLookup[lineNumber];
    for (let i = 0, l = this._methods.length; i < l; i++) {
      let method = this._methods[i];
      if (method.firstLineNumber <= lineNumber && method.lastLineNumber >= lineNumber) {
        return (this._lineToMethodLookup[lineNumber] = method);
      }
    }
    
    return null;
  }
  
  public getScopedMembersAt(lineNumber: number): ActionParameter[] {
    let method = this.getMethodAt(lineNumber);
    return method && method.scopedMembers || [];
  }
  
  public lineInMethod(lineNumber: number): boolean {
    return !! this.getMethodAt(lineNumber);
  }
  
  public setupSelfReferences(): void {
    this.registerMember({
      name: 'this',
      returnType: this.fullType,
      isPublic: false,
      isStatic: false
    });
    if (this.superClass) {
      this.registerMember({
        name: 'super',
        returnType: this._importMap[this.superClass] || this.superClass,
        isPublic: false,
        isStatic: false
      });
    }
    this._importMap[this.shortType] = this.fullType;
    this.baseUri = DirectoryUtility.fileUriAndTypeToBaseUri(this.fileUri, this.fullType);
    this._symbolTree = { name: this.shortType, kind: SymbolKind.Class, range: this.fullRange, selectionRange: this.locationRange };
  }
  
  public get publicInstanceMembers(): ActionParameter[] { return this._publicInstanceMembers; }
  public get publicStaticMembers(): ActionParameter[] { return this._publicStaticMembers; }
  public get staticMembers(): ActionParameter[] { return this._staticMembers; }
  public get instanceMembers(): ActionParameter[] { return this._instanceMembers; }
  public get members(): ActionParameter[] { return this._members; }
  public get symbolTree(): DocumentSymbol { return this._symbolTree; }
  public get importMap(): { [shortType: string]: string } { return this._importMap; }
  public get description(): string {
    this._description = this._description || '(' + (this.isIntrinsic ? 'intrinsic ' : '') + 'class) ' + this.fullType;
    return this._description;
  }
  
  public toString(): string {
    let description = `CLASS '${this.shortType} (fully qualified name: ${this.fullType}):'`;
    description += this.parentPackage ? `\nPARENT PACKAGE: ${this.parentPackage}` : '';
    description += this.superClass ? `\nSUPERCLASS: ${this.superClass}` : '';
    description += `\nIMPORTS:`;
    for (let short in this._importMap) {
      description += `\n - ${short} | ${this._importMap[short]}`;
    }
    description += `\nMEMBERS:`;
    this._members.forEach(member => description += `\n - ${JSON.stringify(member)}`);
    
    return description;
  }
  
  public toPickle(): string {
    this._members.forEach(member => delete member.description);
    return JSON.stringify(<PickledClass>{
      shortType: this.shortType,
      fullType: this.fullType,
      constructorMethod: this.constructorMethod,
      superClass: this.superClass,
      parentPackage: this.parentPackage,
      _imports: this._imports,
      _members: this._members.filter(member => member.name !== 'this' && member.name !== 'super')
    }, (key, value) => {
      if (key !== 'owningClass') return value;  //Skip this property to avoid circular references
    });
  }
  
  public static fromPickle(pickled: PickledClass, isIntrinsic: boolean = false): ActionClass {
    let unpickled = new ActionClass();
    unpickled.shortType = pickled.shortType;
    unpickled.fullType = pickled.fullType;
    let isGlobal = pickled.fullType === '_global';
    unpickled.isIntrinsic = isIntrinsic;
    unpickled.superClass = pickled.superClass;
    unpickled.parentPackage = pickled.parentPackage;
    unpickled.constructorMethod = pickled.constructorMethod;
    pickled._imports.forEach(fullType => unpickled.registerRegularImport(fullType));
    pickled._members.forEach(member => {
      unpickled.registerMember(member);
      if (isGlobal) member.isGlobal = true;
    });
    unpickled.setupSelfReferences();
    return unpickled;
  }
  
}

export enum VisibilityFilter {
  EVERYTHING = 1,
  ALL_INSTANCE,
  PUBLIC_INSTANCE,
  PUBLIC_STATIC,
  ALL_STATIC
}

export interface PickledClass {
  shortType: string;
  fullType: string;
  superClass?: string;
  parentPackage: string;
  constructorMethod?: ActionMethod;
  _imports: string[];
  _members: (ActionParameter|ActionMethod)[];
}

//Class properties; method + constructor params; function-scoped vars
export interface ActionParameter {
  name: string;
  returnType?: string;
  owningClass?: ActionClass;
  isInline?: boolean;
  isArgument?: boolean;
  documentation?: string;
  locationRange?: Range;
  description?: string; //Should be present on all but only after instantiation
  isPublic?: boolean;
  isStatic?: boolean;
  isMethod?: boolean;
  isConstructor?: boolean;
  isGlobal?: boolean;
}

//Class methods
export interface ActionMethod extends ActionParameter {
  isMethod: true;
  isConstructor: boolean;
  parameters: ActionParameter[];
  locals: ActionParameter[];
  scopedMembers?: ActionParameter[]; //Parameters + locals (only combined once registered to a class)
  firstLineNumber?: number;
  lastLineNumber?: number;
  lspSignature?: SignatureInformation;  //Should be present on all but only after instantiation
}

//In-line functions (cf. methods)
export interface ActionILF extends ActionParameter {
  isILF: true;
  parameters: ActionParameter[];
  scopedMembers: ActionParameter[];
}

export function describeActionParameter(param: ActionParameter, paramList: boolean = false): string {
  let parts: string[] = [];
  
  if (param.isGlobal || param.name === 'this' || param.name === 'super') {
    parts.push('intrinsic');
  } else {
    !param.isInline && !param.isArgument && parts.push(param.isPublic ? 'public' : 'private');
    !paramList && param.isArgument && parts.push('(param)');
    param.isStatic && parts.push('static');
  }
  !param.isArgument && parts.push(param.isMethod ? 'function' : 'var');
  parts.push(param.name);
  
  switch (true) {
    case param.isConstructor:
      parts.push('(constructor)');
      break;
    case param.isMethod:
      parts[parts.length - 1] += '(' + (<ActionMethod>param).parameters.map(p => describeActionParameter(p, true)).join(', ') + '):';
      parts.push(param.returnType || '*');
      break;
    default:
      parts[parts.length-1] += ':';
      parts.push(param.returnType || '*');
      break;
  }
  return parts.join(' ');
}

export function deriveMethodSignature(method: ActionMethod): SignatureInformation {
  let sig: SignatureInformation = {
    label: method.name,
    parameters: []
  };
  
  sig.label += '(' + method.parameters.map(param => {
    let arg = param.name + ': ' + (param.returnType || '*');
    sig.parameters.push({ label: arg });
    return arg;
  }).join(', ') + '): ' + (method.returnType || '*');
  
  return sig;
}
