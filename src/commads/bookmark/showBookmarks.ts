import * as path from 'path';
import * as vscode from 'vscode';
import { DESCRIPTION_CONNECTOR_SYMBOL, commandList } from '../../global';
import { BookmarkManager } from '../../manager/bookmarkManager';
import { IFileTextItem, showFileTextItem } from '../../manager/common';

export class ShowBookmarksCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected _manager: BookmarkManager) {
        this._disposable.push(
            vscode.commands.registerCommand(commandList.showBookmarks, this.execute, this),
        );
    }

    protected async execute() {
        const picks = this.createPicks();
        const options: vscode.QuickPickOptions = {
            canPickMany: false,
            placeHolder: '',
        };
        vscode.window.showQuickPick(picks, options).then((item) => {
            if (!item) {
                return;
            }
            showFileTextItem(item.fileTextItem, this._manager);
        });
    }

    private createPicks() {
        const bookmarks = this._manager.fileTexts;
        const picks = bookmarks.map((fileText) => {
            const item: BookmarkQuickPickItem = {
                fileTextItem: fileText,
                label: '',
            };
            return item;
        });

        picks.sort((a: BookmarkQuickPickItem, b: BookmarkQuickPickItem) => {
            let ta = a.fileTextItem.updateCount;
            let tb = b.fileTextItem.updateCount;
            return tb - ta;
        });

        picks.forEach((pick, i) => {
            const label = i.toString() + ') ' + pick.fileTextItem.value;
            pick.label = label;

            if (pick.fileTextItem.createdLocation) {
                const description =
                    path.basename(pick.fileTextItem.createdLocation.uri.path) +
                    DESCRIPTION_CONNECTOR_SYMBOL +
                    pick.fileTextItem.updateCount.toString();
                pick.description = description;
            }
        });

        return picks;
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }
}

interface BookmarkQuickPickItem extends vscode.QuickPickItem {
    fileTextItem: IFileTextItem;
}
