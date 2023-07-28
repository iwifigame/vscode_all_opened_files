import * as vscode from "vscode";
import * as path from "path";
import { commandList } from "../global";
import { BookmarkManager } from "../manager/bookmarkManager";
import { leftPad } from "../util/util";
import { IFileTextItem } from "../manager/common";

export class BookmarkItem extends vscode.TreeItem {
    constructor(readonly bookmark: IFileTextItem) {
        super(bookmark.value);

        this.contextValue = "bookmarkItem:";
        this.label = this.bookmark.value.replace(/\s+/g, " ").trim();
        this.tooltip = this.bookmark.value;

        this.command = {
            command: commandList.showBookmarkInFile,
            "title": "Show in the file",
            tooltip: "Show in the file",
            arguments: [null, this.bookmark],
        };

        if (this.bookmark.createdLocation) {
            this.resourceUri = this.bookmark.createdLocation.uri; // 会自动根据后缀设置前面的图标
            this.contextValue += "file";
            this.tooltip = `File: ${this.resourceUri.fsPath}\nValue: ${this.tooltip}\n`;
            this.description = path.basename(this.resourceUri.path) + "---" + bookmark.updateCount;
        } else {
            // 设置项目前面的图标
            const basePath = path.join(__filename, "..", "..", "..", "resources");

            this.iconPath = {
                light: path.join(basePath, "light", "string.svg"),
                dark: path.join(basePath, "dark", "string.svg"),
            };
        }
    }
}

export class BookmarkTreeDataProvider implements vscode.TreeDataProvider<BookmarkItem>, vscode.Disposable {
    private _disposables: vscode.Disposable[] = [];

    private _onDidChangeTreeData: vscode.EventEmitter<BookmarkItem | null> = new vscode.EventEmitter<BookmarkItem | null>();
    public readonly onDidChangeTreeData: vscode.Event<BookmarkItem | null> = this._onDidChangeTreeData.event;

    constructor(private _manager: BookmarkManager) {
        this._manager.onDidChangeFileTextList(() => {
            // 通知树修改
            this._onDidChangeTreeData.fire(null); // manager的事件修改了，这里也派发事件
        });
    }

    public getTreeItem(element: BookmarkItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    public getChildren(_element?: BookmarkItem | undefined): vscode.ProviderResult<BookmarkItem[]> {
        const bookmarks = this._manager.fileTexts;

        const maxLength = `${bookmarks.length}`.length;

        // 创建树中的子节点
        // todo: 以文件为父节点，书签为叶子节点显示
        const childs = bookmarks.map((c, index) => {
            const item = new BookmarkItem(c);
            const indexNumber = leftPad(index + 1, maxLength, "0");

            if (c.param) {
                item.label = `${c.param}) ${item.label}`;
            } else {
                item.label = `${indexNumber}) ${item.label}`;
            }


            return item;
        });

        return childs;
    }

    public dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}
