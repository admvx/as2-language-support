# Changelog

Updates to the AS2 Language Support project will be documented here as new versions are released.

## [1.3.4](https://github.com/admvx/as2-language-support/compare/v1.3.3...v1.3.4) - 2021-10-30
- Fix an issue with block comment sanitization consuming one character too many, leading to parse errors
- Refactor extension build tooling, and fix breakpoints in debug sessions

## [1.3.3](https://github.com/admvx/as2-language-support/compare/v1.3.2...v1.3.3) - 2020-07-06
Maintenance update:
- Add initial unit tests (around ~40% code coverage so far)
- Refactor parsing code to avoid server hangs
- Include CHANGELOG.md and LICENSE files in VSCode extension bundle
- Update dependencies to latest versions

## [1.3.2](https://github.com/admvx/as2-language-support/compare/v1.3.1...v1.3.2) - 2020-05-19
- Add in missing methods to intrinsic classes to improve completions
- Clean up formatting of intrinsic class files
- Move release notes from readme into separate changelog file

## [1.3.1](https://github.com/admvx/as2-language-support/compare/v1.3.0...v1.3.1) - 2020-05-09
- Refresh dependencies and packages to match canonical vscode-lsp extension example
- Fix superclass member completion bug

## [1.3.0](https://github.com/admvx/as2-language-support/compare/v1.2.3...v1.3.0) - 2020-05-03
- Add hover and definition support for long-form class references ('import' and 'extends' statements)
- Fix method signature identification inside array and object literals

## [1.2.3](https://github.com/admvx/as2-language-support/compare/v1.2.2...v1.2.3) - 2020-02-06
Fix bug with tracking of nested method signatures

## [1.2.2](https://github.com/admvx/as2-language-support/compare/v1.2.1...v1.2.2) - 2020-01-24
Update format of repository url in `package.json`

## [1.2.1](https://github.com/admvx/as2-language-support/compare/v1.2.0...v1.2.1) - 2020-01-21
Addresses the following issues:
- Superclass members are not resolved when super declaration uses short type
- Local variables declared after string literals in the same statement are not indexed
- Npm task `parse-intrinsics` no longer runs successfully

## [1.2.0](https://github.com/admvx/as2-language-support/compare/v1.1.0...v1.2.0) - 2020-01-21
Add definition support (jump to definition, peek definition)

## [1.1.0](https://github.com/admvx/as2-language-support/compare/v1.0.1...v1.1.0) - 2020-01-19
- Removes the requirement that the active vscode workspace directory must match the root class-path of any open files
- Improves handling of wildcard imports
- Fixes bug where parse queue halts upon encountering a missing file

## [1.0.1](https://github.com/admvx/as2-language-support/compare/v1.0.0...v1.0.1) - 2020-01-08
Addresses the following issues:
- No method signature support for the super constructor
- Type casts trigger completions for static instead of instance properties
- Parentheses triggers signature completion for class constructor
- No differentiation between called methods and accessed properties

## [1.0.0](https://github.com/admvx/as2-language-support/releases/tag/v1.0.0) - 2020-01-01
Initial release
