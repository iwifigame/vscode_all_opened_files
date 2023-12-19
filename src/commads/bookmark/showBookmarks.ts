import * as vscode from 'vscode';
import { LABEL_CONNECTOR_SYMBOL, commandList } from '../../global';
import { BookmarkManager } from '../../manager/bookmarkManager';
import {
    IFileTextItem,
    fileTextLocationCompare,
    getFileTextDescription,
    showFileTextItem,
} from '../../manager/common';
import { QuickBookmarkManager } from '../../manager/quickBookmarkManager';

export class ShowBookmarksCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(
        private _bookmarkManager: BookmarkManager,
        private _quickBookmarkManager: QuickBookmarkManager,
    ) {
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

            if (item.fileTextItem.param) {
                showFileTextItem(item.fileTextItem, this._quickBookmarkManager);
            } else {
                showFileTextItem(item.fileTextItem, this._bookmarkManager);
            }
        });
    }

    private createPicks() {
        const bookmarks = [
            ...this._bookmarkManager.fileTexts,
            ...this._quickBookmarkManager.fileTexts,
        ];

        const picks = bookmarks.map((fileText) => {
            const item: BookmarkQuickPickItem = {
                fileTextItem: fileText,
                label: '',
            };
            return item;
        });

        picks.sort((a: BookmarkQuickPickItem, b: BookmarkQuickPickItem) => {
            let fa = a.fileTextItem;
            let fb = b.fileTextItem;
            if (fa.param && fb.param) {
                if (fa.param > fb.param) {
                    return 1;
                } else if (fa.param < fb.param) {
                    return -1;
                } else {
                    return fileTextLocationCompare(fa, fb);
                }
            } else if (!fa.param && !fb.param) {
                let ca = fa.updateCount;
                let cb = fb.updateCount;
                return cb - ca;
            } else if (fa.param) {
                return -1;
            } else {
                return 1;
            }
        });

        let bookmarkIndex = 0;
        picks.forEach((pick, i) => {
            const bookmark = pick.fileTextItem;
            let label: string;
            if (bookmark.param) {
                label = bookmark.param + LABEL_CONNECTOR_SYMBOL + bookmark.value;
            } else {
                bookmarkIndex++;
                label = bookmarkIndex.toString() + LABEL_CONNECTOR_SYMBOL + bookmark.value;
            }
            pick.label = label;

            if (pick.fileTextItem.createdLocation) {
                pick.description = getFileTextDescription(pick.fileTextItem);
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
