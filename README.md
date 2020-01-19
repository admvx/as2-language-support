# AS2 Language Support

https://github.com/admvx/as2-language-support

## Features
- Syntax highlighting for ActionScript 2.0 (`*.as`)
- LSP-based code completion
- Intrinsic language features + local code parsing

## Coming soon
- Go-to / peek definition support
- Contextual suggestion filtering
- Performance improvements via WASM regex implementation

## Release Notes

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
