import * as vscode from 'vscode';
import * as path from 'path';

import { commandList } from "../global";

export class QuickOpenCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor() {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.quickOpen,
                this.execute,
                this
            )
        );

        this.init();
    }

    private init() {
    }

    protected async execute(filePath: string, line: Number = 0, character: Number = 0) {
        try {
            const activeTextEditor = vscode.window.activeTextEditor;
            if (activeTextEditor == undefined) {
                return
            }
            if (activeTextEditor.document.fileName !== filePath) {
                const homedir = require("os").homedir();
                if (filePath.includes("~")) {
                    filePath = path.join(homedir, filePath.replace("~", ""));
                }
                const doc = await vscode.workspace.openTextDocument(
                    vscode.Uri.file(filePath)
                );
                const editor = await vscode.window.showTextDocument(doc);
                this.revealEditorPosition(editor, line, character);
            }
        } catch (error) {
            console.error(`error:`, error);
            // vscode.window.showErrorMessage(error.message);
        }
    }


    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }

    private revealEditorPosition(editor: any, line: any, character: any) {
        if (!line) return;
        character = character || 1;
        const position = new vscode.Position(line - 1, character - 1);
        editor.selections = [new vscode.Selection(position, position)];
        editor.revealRange(
            new vscode.Range(position, position),
            vscode.TextEditorRevealType.InCenterIfOutsideViewport
        );
    }
}