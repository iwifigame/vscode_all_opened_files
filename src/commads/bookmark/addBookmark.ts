import * as vscode from 'vscode';
import { commandList } from '../../global';
import { BookmarkManager } from '../../manager/bookmarkManager';
import { IFileTextChange, createTextChange } from '../../manager/common';
import { QuickBookmarkManager } from '../../manager/quickBookmarkManager';
import { decoration } from '../../util/decorationUtil';
import { getWordAtCursor } from '../../util/util';

export class AddBookmarkCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(
        protected _manager: BookmarkManager,
        protected _quickManager: QuickBookmarkManager,
    ) {
        this._disposable.push(
            vscode.commands.registerCommand(commandList.addBookmark, this.execute, this),
        );
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }

    // @param mark: 当前光标所在单词对应的标签:如a,b,c...
    // 有mark则添加到quick bookmark中，否则添加到默认的bookmark中
    protected async execute(mark: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor == undefined) {
            return;
        }

        let change = this.createBookmarkChange(editor);
        if (mark) {
            // 有标签，则添加到快捷标签列表中
            this.addQuickBookmark(change, mark, editor);
        } else {
            this._manager.addFileText(change);
        }
    }

    private createBookmarkChange(editor: vscode.TextEditor) {
        let text = editor.document.getText(editor.selection);
        let range: vscode.Range | undefined;
        if (!text) {
            text = getWordAtCursor(editor);
            if (!text) {
                // 没有单词，则使用整行
                const cursorPosition = editor.selection.active;
                text = editor.document.lineAt(cursorPosition.line).text.trim();
                // range = editor.document.lineAt(cursorPosition.line).range;
            } else {
                // 得到当前光标处的单词范围
                range = editor.document.getWordRangeAtPosition(editor.selection.active);
            }
        }

        const change = createTextChange(editor, text);
        if (range && change.createdLocation) {
            change.createdLocation.range = range;
        }

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
}
