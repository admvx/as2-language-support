import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  let serverModule = context.asAbsolutePath(
    path.join('server', 'out', 'server.js')
  );
  
  let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  let serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };

  let clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'actionscript' }], //Engage the server when actionscript files are opened
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/.as') //Notify the server about file changes to .as files contained in the workspace
    }
  };

  client = new LanguageClient(
    'as2-language-support',
    'ActionScript 2.0 Language Support',
    serverOptions,
    clientOptions
  );

  client.start();
}

export function deactivate(): Thenable<void> {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
