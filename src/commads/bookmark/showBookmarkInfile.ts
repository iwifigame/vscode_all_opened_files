import * as vscode from 'vscode';
import { BookmarkManager } from '../../manager/bookmarkManager';
import { commandList } from '../../global';
import { IFileTextItem, showFileTextItem } from '../../manager/common';
import { QuickBookmarkManager } from '../../manager/quickBookmarkManager';

export class ShowBookmarkInFileCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(
        protected _manager: BookmarkManager,
        protected _quickManager: QuickBookmarkManager,
    ) {
        this._disposable.push(
            vscode.commands.registerCommand(commandList.showBookmarkInFile, this.execute, this),
        );
    }

    protected async execute(mark: string, item: IFileTextItem) {
        let bookmark = item;
        if (mark) {
            let tmp = this._quickManager.getFileTextByParam(mark);
            if (tmp) {
                bookmark = tmp;
            }
        }

        showFileTextItem(bookmark, this._manager);
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }
}
