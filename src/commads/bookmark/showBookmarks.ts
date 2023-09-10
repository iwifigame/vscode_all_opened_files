import * as path from "path";
import * as vscode from "vscode";
import { commandList } from "../../global";
import { BookmarkManager } from "../../manager/bookmarkManager";
import { IFileTextItem, showFileTextItem } from "../../manager/common";

interface BookmarkItem extends vscode.QuickPickItem {
    fileTextItem: IFileTextItem
}

export class ShowBookmarksCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected _manager: BookmarkManager) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.showBookmarks,
                this.execute,
                this
            )
        );
    }

    protected async execute() {
        const picks = this.createPicks();
        const options: vscode.QuickPickOptions = {
            canPickMany: false,
            placeHolder: ""
        };
        vscode.window.showQuickPick(picks, options).then(item => {
            if (item) {
                const path = item.fileTextItem.createdLocation?.uri.path;
                if (!path) {
                    return
                }

                showFileTextItem(item.fileTextItem, this._manager)
            }
        });
    }

    private createPicks() {
        const bookmarks = this._manager.fileTexts;
        const picks = bookmarks.map((fileText, i) => {
            const item: BookmarkItem = {
                fileTextItem: fileText,
                label: "",
            };
            return item;
        });

        picks.sort((a: BookmarkItem, b: BookmarkItem) => {
            let ta = a.fileTextItem.updateCount;
            let tb = b.fileTextItem.updateCount;
            return tb - ta;
        });

        // const maxLength = `${bookmarks.length}`.length;
        picks.forEach((pick, i) => {
            const label = i.toString() + ") " + pick.fileTextItem.value;
            // const indexNumber = leftPad(i + 1, maxLength, "0");
            // const label = `${indexNumber}) ${pick.fileTextItem.value}`;
            let description = pick.fileTextItem.updateCount.toString();
            if (pick.fileTextItem.createdLocation) {
                description = path.basename(pick.fileTextItem.createdLocation?.uri.path) + "---" + description;
            }

            pick.label = label;
            pick.description = description.toString();
        });

        return picks;
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}