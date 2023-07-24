import * as vscode from 'vscode';
import * as path from 'path';

import { commandList } from "../global";
import { FileManager } from '../manager/fileManager';

export class QuickOpenCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected _manager: FileManager) {
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

    protected async execute(filePath: string) {
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

                let t = this._manager.getFileText(filePath);
                if (t && t.createdLocation) {
                    const opts: vscode.TextDocumentShowOptions = {
                        viewColumn: vscode.ViewColumn.Active,
                    };
                    opts.selection = t.createdLocation.range;
                    await vscode.window.showTextDocument(doc, opts);
                } else {
                    this.revealEditorPosition(editor, 0, 0);
                }
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