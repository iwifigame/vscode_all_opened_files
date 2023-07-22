import * as vscode from "vscode";
import { BookmarkManager, IBookmarkTextChange } from "../manager/bookmarkManager";
import { commandList } from "../global";
// import { selectWordAtCursorPosition } from "vscode-ext-selection";

export class AddBookmarkCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected _manager: BookmarkManager) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.addBookmark,
                this.execute,
                this
            )
        );
    }

    protected async execute() {
        const editor = vscode.window.activeTextEditor;
        if (editor == undefined) {
            return
        }

        let text: string;
        if (this.selectWordAtCursorPosition(editor)) {
            text = editor.document.getText(editor.selection);
        } else {
            const cursorPosition = editor.selection.active;
            text = editor.document.lineAt(cursorPosition.line).text;
        }

        const change: IBookmarkTextChange = {
            value: text,
            timestamp: Date.now(),
        };

        if (vscode.window.state.focused && editor && editor.document) {
            // Set current language of copied clip
            change.language = editor.document.languageId;

            // Try get position of clip
            if (editor.selection) {
                const selection = editor.selection;
                change.location = {
                    range: new vscode.Range(selection.start, selection.end),
                    uri: editor.document.uri,
                };
            }
        }

        this._manager.addBookmark(change);

    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }

    private selectWordAtCursorPosition(editor: vscode.TextEditor) {
        if (!editor.selection.isEmpty) {
            return true;
        }
        var cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.active);
        if (!cursorWordRange) {
            return false;
        }
        var newSe = new vscode.Selection(cursorWordRange.start.line, cursorWordRange.start.character, cursorWordRange.end.line, cursorWordRange.end.character);
        editor.selection = newSe;
        return true;
    }
}
