# Source code guide

- ## `server/src/action-context.ts`:
  The central store of parsed data about the code base; provides the core completion functionality
- ## `server/src/action-elements.ts`:
  A set of classes, interfaces and helper functions for describing and rendering the various language constructs, instantiated during parsing
- ## `server/src/action-parser.ts`:
  A collection of regular expresses and a central class for modelling the AS2 code from raw input strings
- ## `server/src/config.ts`:
  Contains the build configuration plus minor common functions
- ## `server/src/file-system-utilities.ts`:
  Some helper methods for managing data I/O
- ## `server/src/intrinsic-pickles.ts`:
  Pre-parsed intrinsic classes provided by Flash Player
- ## `server/src/server.ts`:
  Initializes the LSP server and connects it to the functionality provided by `action-context.ts`
- ## `server/src/scripts/parse-intrinsics.ts`:
  An offline script
