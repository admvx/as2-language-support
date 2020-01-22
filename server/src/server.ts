import { createConnection, TextDocuments, ProposedFeatures } from 'vscode-languageserver';
import { ActionContext } from './action-context';
import { ActionParser } from './action-parser';
import { setConsole, logIt, LogLevel, ActionConfig } from './config';
import { pickles } from './intrinsic-pickles';

ActionContext.loadPickles(pickles);

let connection = createConnection(ProposedFeatures.all);  //Create the LSP connection
let documents = new TextDocuments();  //Create a simple text document manager (only supports full document sync)
setConsole(connection.console); //Forward logs into the client's console
documents.listen(connection); //Make the text document manager listen on the connection for open, change and close text document events

let workspaceFolder: string | null;
connection.onInitialize((params) => {
  workspaceFolder = params.rootUri;
  ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.INFO, message: `[Server(${process.pid}) ${workspaceFolder}] Started and initialize received.` });
  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
      completionProvider: { resolveProvider: false, triggerCharacters: ['.'] },
      signatureHelpProvider: { triggerCharacters: ['(', ','] },
      hoverProvider: true,
      definitionProvider: true
    }
  };
});

connection.listen();

ActionParser.initialise()
  .then(() => {
    documents.onDidOpen((evt) => {
      let actionClass = ActionParser.parseFile(evt.document.uri, evt.document.getText(), true);
      ActionContext.registerClass(actionClass);
      ActionConfig.LOG_LEVEL !== LogLevel.NONE && logIt({ level: LogLevel.VERBOSE, message: actionClass.toPickle() });
    });
    documents.onDidChangeContent(change => ActionContext.registerClass(ActionParser.parseFile(change.document.uri, change.document.getText(), true)));
    connection.onCompletion((docPos, token) => ActionContext.getCompletions(docPos, token));
    connection.onSignatureHelp((docPos, token) => ActionContext.getSignatureHelp(docPos, token));
    connection.onHover(docPos => ActionContext.getHoverInfo(docPos));
    connection.onDefinition(docPos => ActionContext.getDefinition(docPos));
  });
