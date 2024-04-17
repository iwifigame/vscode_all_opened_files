import * as vscode from 'vscode';
import { commandList } from '../../global';
import { BookmarkManager } from '../../manager/bookmarkManager';
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

    // execute的参数，由执行命令时传入。可通过配置设置参数
    protected async execute(mark: string, item: IFileTextItem, isFromTree: boolean) {
        if (mark) {
            let bookmark: IFileTextItem | undefined;
            if (isFromTree) {
                // 是从树视图中执行的
                bookmark = item;
            } else {
                // 是直接从命令中执行的
                bookmark = this._quickManager.getFileTextByParam(mark);
            }
            showFileTextItem(bookmark, this._quickManager);
        } else {
            const bookmark = item;
            showFileTextItem(bookmark, this._manager);
        }
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }
}
