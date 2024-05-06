import * as vscode from 'vscode';
import { commandList } from '../../global';
import { exec } from 'child_process';

export class ShowLogCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor() {
        this._disposable.push(
            vscode.commands.registerCommand(commandList.showLog, this.execute, this),
        );
    }

    protected async execute() {
        const myPanel = new MyPanel();
        myPanel.execute();
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }
}

export class MyPanel {
    private panel: vscode.WebviewPanel | undefined;

    constructor() {
        this.panel = undefined;
    }

    public async execute() {
        this.panel = vscode.window.createWebviewPanel(
            'myPanel',
            'My Panel',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            },
        );

        this.panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>My Panel</title>
            </head>
            <body>
                <h1>Search Content:</h1>
                <input type="text" id="searchInput">
                <button onclick="search()">Search</button>
                <h1>Matched Lines:</h1>
                <ul id="matchedLines"></ul>
                <script>
                    const vscode = acquireVsCodeApi();
                    function search() {
                        const searchInput = document.getElementById('searchInput');
                        const searchContent = searchInput.value;
                        console.log(searchContent );

                        // Call the execute method with the search content
                        vscode.postMessage({ command: 'execute', searchContent });
                    }
                </script>
            </body>
            </html>`;

        this.panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'execute') {
                const searchContent = message.searchContent;
                // Call the original execute method with the search content
                this.executeWithContent(searchContent);
            }
        });
    }

    private async executeWithContent(searchContent: string) {
        const gameLogPath = 'e:/workspace/Client/BinGame/logs/game_80000335';

        exec(`grep -R ${searchContent} ${gameLogPath}`, (error, stdout, stderr) => {
            let matchedLines: string[] = [];
            if (error) {
                console.error(`Error executing rg command: ${error.message}`);
                matchedLines.push(`Error executing rg command: ${error.message}`);
            } else {
                matchedLines = stdout.split('\n').filter((line) => line.trim() !== '');
            }

            const htmlContent = `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>My Panel</title>
                  </head>
                  <body>
                    <h1>Matched Lines:</h1>
                    <ul>
                      ${matchedLines.map((line) => `<li>${line}</li>`).join('')}
                    </ul>
                  </body>
                  </html>`;

            if (this.panel) {
                this.panel.webview.html = htmlContent;
            }
        });
    }
}
