import * as vscode from "vscode";
import { BookmarkItem } from "../tree/bookmarkTree";
import { commandList } from "../global";
import { BookmarkManager } from "../manager/bookmarkManager";
import { QuickBookmarkManager } from "../manager/quickBookmarkManager";

export class RemoveBookmarkCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected _manager: BookmarkManager, protected _quickManager: QuickBookmarkManager) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.removeBookmark,
                this.execute,
                this
            )
        );
    }

    protected execute(item: BookmarkItem) {
        if (item.bookmark.param) {
            this._quickManager.remove(item.bookmark);
        } else {
            this._manager.remove(item.bookmark);
        }
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
