import * as vscode from "vscode";
import { BookmarkManager } from "../manager/bookmarkManager";
import { commandList } from "../global";
import { QuickBookmarkManager } from "../manager/quickBookmarkManager";
import { getWordAtCursor } from "../util/util";
import { decoration } from "../util/decorationUtil";

export class AddBookmarkCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected _manager: BookmarkManager, protected _quickManager: QuickBookmarkManager) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.addBookmark,
                this.execute,
                this
            )
        );
    }

    protected async execute(mark: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor == undefined) {
            return
        }

        let text = getWordAtCursor(editor);
        if (!text) {
            const cursorPosition = editor.selection.active;
            text = editor.document.lineAt(cursorPosition.line).text;
        }

        if (mark) {
            const change = this._quickManager.createChange(editor, text);
            change.param = mark
            this._quickManager.addFileText(change);

            let m = decoration.getOrCreateMarkDecoration(mark);
            if (change.createdLocation) {
                editor.setDecorations(m, [change.createdLocation.range]);
            }
        } else {
            const change = this._manager.createChange(editor, text);
            this._manager.addFileText(change);
        }
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }

}
