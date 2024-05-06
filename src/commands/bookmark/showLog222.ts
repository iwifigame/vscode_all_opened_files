import * as vscode from 'vscode';
import { commandList } from '../../global';

export class ShowLogCommand222 implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor() {
        this._disposable.push(
            vscode.commands.registerCommand(commandList.showLog, this.execute, this),
        );
    }

    protected async execute() {
        const uri = await vscode.window.showOpenDialog({ canSelectMany: false });
        if (uri && uri.length > 0) {
            const panel = vscode.window.createWebviewPanel(
                'myPanel',
                'My Panel',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                },
            );

            const document = await vscode.workspace.openTextDocument(uri[0]);
            const content = document.getText();

            panel.webview.html = `<!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>My Panel</title>
              </head>
              <body>
                <pre>${content}</pre>
              </body>
              </html>`;
        }
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }
}
