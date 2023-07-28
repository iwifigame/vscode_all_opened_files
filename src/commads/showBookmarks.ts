import * as vscode from "vscode";
import * as path from "path";
import { leftPad } from "../util/util";
import { commandList } from "../global";
import { IFileTextItem } from "../manager/common";
import { BookmarkManager } from "../manager/bookmarkManager";

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
        const bookmarks = this._manager.fileTexts;
        const maxLength = `${bookmarks.length}`.length;
        const picks = bookmarks.map((fileText, i) => {
            const item: BookmarkItem = {
                fileTextItem: fileText,
                label: "",

            };
            return item;
        });
        picks.sort((a: BookmarkItem, b: BookmarkItem) => {
            let ta = a.fileTextItem.updateCount
            let tb = b.fileTextItem.updateCount
            return tb - ta
        });
        picks.forEach((pick, i) => {
            const label = i.toString() + ") " + pick.fileTextItem.value;
            // const indexNumber = leftPad(i + 1, maxLength, "0");
            // const label = `${indexNumber}) ${pick.fileTextItem.value}`;
            let description = pick.fileTextItem.updateCount.toString();
            if (pick.fileTextItem.createdLocation) {
                description = path.basename(pick.fileTextItem.createdLocation?.uri.path) + "---" + description;
            }

            pick.label = label
            pick.description = description.toString()
        });

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

                const options = {
                    selection: item.fileTextItem.createdLocation?.range,
                };
                vscode.window.showTextDocument(vscode.Uri.file(path), options).then((editor) => {
                    this._manager.updateFileTextByItem(item.fileTextItem);
                });
            }
        });
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}