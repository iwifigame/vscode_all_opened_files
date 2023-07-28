import * as vscode from "vscode";
import { commandList } from "../global";
import { getWordAtCursor } from "../util/util";
import { decoration } from "../util/decorationUtil";
import { BookmarkManager } from "../manager/bookmarkManager";
import { QuickBookmarkManager } from "../manager/quickBookmarkManager";
import { IFileTextChange, createChange } from "../manager/common";

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

    // @param mark: 当前光标所在单词，对应的标签:如a,b,c...
    // 有mark则添加到quick bookmark中，否则添加到默认的bookmark中
    protected async execute(mark: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor == undefined) {
            return
        }

        let change = this.getBookmarkChange(editor);
        if (mark) {// 有标签，则添加到快捷标签列表中
            this.addQuickBookmark(change, mark, editor);
        } else {
            this._manager.addFileText(change);
        }
    }

    private getBookmarkChange(editor: vscode.TextEditor) {
        let text = editor.document.getText(editor.selection);
        if (!text) {
            text = getWordAtCursor(editor);
            if (!text) {
                const cursorPosition = editor.selection.active;
                text = editor.document.lineAt(cursorPosition.line).text;
            }
        }
        const change = createChange(editor, text);
        return change;
    }

    private addQuickBookmark(change: IFileTextChange, mark: string, editor: vscode.TextEditor) {
        change.param = mark;
        this._quickManager.addFileText(change);

        // 添加装饰标记
        let m = decoration.getOrCreateMarkDecoration(mark);
        if (change.createdLocation) {
            editor.setDecorations(m, [change.createdLocation.range]);
        }
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
