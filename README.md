# AS2 Language Support

https://github.com/admvx/as2-language-support

## Features
- Syntax highlighting for ActionScript 2.0 (`*.as`)
- LSP-based assistance with the following features:
  - Completion
  - Hover info
  - Method signatures
  - Definition resolution (jump to definition, peek definition)
- Intrinsic language features + local code parsing

## Release Notes

### 1.3.0
- Adds hover and definition support for long-form class references ('import' and 'extends' statements)
- Fixes method signature identification inside array and object literals

### 1.2.3
Fix bug with tracking of nested method signatures

### 1.2.2
Update format of repository url in `package.json`

### 1.2.1
Addresses the following issues:
- Superclass members are not resolved when super declaration uses short type
- Local variables declared after string literals in the same statement are not indexed
- Npm task `parse-intrinsics` no longer runs successfully

### 1.2.0
Add definition support (jump to definition, peek definition)

### 1.1.0
- Removes the requirement that the active vscode workspace directory must match the root class-path of any open files
- Improves handling of wildcard imports
- Fixes bug where parse queue halts upon encountering a missing file

### 1.0.1
Addresses the following issues:
- No method signature support for the super constructor
- Type casts trigger completions for static instead of instance properties
- Parentheses triggers signature completion for class constructor
- No differentiation between called methods and accessed properties

### 1.0.0
Initial release
