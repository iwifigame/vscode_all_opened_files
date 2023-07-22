import * as path from "path";
import * as vscode from "vscode";
import { commandList } from "../global";
import { BookmarkManager, IBookmarkItem } from "../manager/bookmarkManager";
import { leftPad } from "../util/util";

export class BookmarkItem extends vscode.TreeItem {
    constructor(readonly bookmark: IBookmarkItem) {
        super(bookmark.value);

        this.contextValue = "bookmarkItem:";
        this.label = this.bookmark.value.replace(/\s+/g, " ").trim();
        this.tooltip = this.bookmark.value;

        this.command = {
            command: commandList.showBookmarkInFile,
            "title": "Show in the file",
            tooltip: "Show in the file",
            arguments: [this.bookmark],
        };

        if (this.bookmark.createdLocation) {
            this.resourceUri = this.bookmark.createdLocation.uri;
            this.contextValue += "file";

            this.tooltip = `File: ${this.resourceUri.fsPath}\nValue: ${this.tooltip}\n`;
        } else {
            const basePath = path.join(__filename, "..", "..", "..", "resources");

            this.iconPath = {
                light: path.join(basePath, "light", "string.svg"),
                dark: path.join(basePath, "dark", "string.svg"),
            };
        }
    }
}

export class BookmarkTreeDataProvider
    implements vscode.TreeDataProvider<BookmarkItem>, vscode.Disposable {
    private _disposables: vscode.Disposable[] = [];

    private _onDidChangeTreeData: vscode.EventEmitter<BookmarkItem | null> =
        new vscode.EventEmitter<BookmarkItem | null>();
    public readonly onDidChangeTreeData: vscode.Event<BookmarkItem | null> =
        this._onDidChangeTreeData.event;

    constructor(protected _manager: BookmarkManager) {
        this._manager.onDidChangeBookmarkList(() => {
            this._onDidChangeTreeData.fire(null);
        });
    }

    public getTreeItem(element: BookmarkItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    public getChildren(_element?: BookmarkItem | undefined): vscode.ProviderResult<BookmarkItem[]> {
        const bookmarks = this._manager.bookmarks;

        const maxLength = `${bookmarks.length}`.length;

        const childs = bookmarks.map((c, index) => {
            const item = new BookmarkItem(c);
            const indexNumber = leftPad(index + 1, maxLength, "0");

            item.label = `${indexNumber}) ${item.label}`;

            return item;
        });

        return childs;
    }

    public dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}
