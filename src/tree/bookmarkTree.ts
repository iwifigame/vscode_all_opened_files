import * as vscode from "vscode";
import * as path from "path";
import { commandList } from "../global";
import { leftPad, pathEqual } from "../util/util";
import { IFileTextItem } from "../manager/common";
import { AbstractManager } from "../manager/abstractManager";

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

    private tree: vscode.TreeView<BookmarkItem> | undefined;
    private data: BookmarkItem[] = [];

    constructor(private _manager: AbstractManager) {
        this._manager.onDidChangeFileTextList(() => {
            // 通知树修改
            this._onDidChangeTreeData.fire(null); // manager的事件修改了，这里也派发事件
        });

        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (!this.tree || !this.tree.visible) {
                return
            }

            if (!editor) {
                return
            }

            let doc = editor.document
            if (doc == undefined) {
                return
            }

            let filePath = doc.fileName;
            this.autoSelectCurrentFileItems(filePath)
        })
    }

    public setTreeView(t: vscode.TreeView<BookmarkItem>) {
        this.tree = t;
    }

    private autoSelectCurrentFileItems(filePath: string) {
        if (!this.tree || !this.tree.visible) {
            return
        }

        // 如果当前树中选择的路径和指定路径相同，则不处理
        if (this.tree.selection.length > 0) {
            let cur = this.tree.selection[0];
            if (pathEqual(cur.bookmark.createdLocation?.uri.path, filePath)) {
                return
            }
        }

        // 高亮显示当前文件中的标签
        const item = this.getOneTreeItemByPath(filePath);
        if (!item) {
            return
        }
        this.tree.reveal(item, { focus: false, select: true });
    }

    private getOneTreeItemByPath(filePath: string) {
        let tmp = this.data.find((x: BookmarkItem) => {
            if (pathEqual(x.bookmark.createdLocation?.uri.path, filePath)) {
                return x;
            }
        });
        return tmp;
    }

    getParent(element: BookmarkItem): vscode.ProviderResult<BookmarkItem> {
        return undefined;
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

        this.data = childs;

        return childs;
    }

    public dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}
