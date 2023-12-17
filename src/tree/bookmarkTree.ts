import * as path from 'path';
import * as vscode from 'vscode';
import { DESCRIPTION_CONNECTOR_SYMBOL, EXTRA_PARAM_NOT_FOUND, commandList } from '../global';
import { AbstractManager } from '../manager/abstractManager';
import { IFileTextItem } from '../manager/common';
import { compressSpaces, getWordAtCursor, pathEqual } from '../util/util';

export class BookmarkTreeDataProvider
    implements vscode.TreeDataProvider<BookmarkTreeItem>, vscode.Disposable
{
    private _disposables: vscode.Disposable[] = [];

    private _onDidChangeTreeData: vscode.EventEmitter<BookmarkTreeItem | null> =
        new vscode.EventEmitter<BookmarkTreeItem | null>();
    public readonly onDidChangeTreeData: vscode.Event<BookmarkTreeItem | null> =
        this._onDidChangeTreeData.event;

    private tree: vscode.TreeView<BookmarkTreeItem> | undefined;
    private data: BookmarkTreeItem[] = [];
    private curFileData: BookmarkTreeItem[] = [];

    constructor(private _manager: AbstractManager) {
        this._manager.onDidChangeFileTextList(() => {
            // 通知树修改
            this._onDidChangeTreeData.fire(null); // manager的事件修改了，这里也派发事件
        });

        // 选择范围变化时，自动选择当前光标下的书签
        vscode.window.onDidChangeTextEditorSelection((e) => {
            let editor = e.textEditor;

            let doc = editor.document;
            if (doc == undefined) {
                return;
            }

            let filePath = doc.fileName;
            let text = getWordAtCursor(editor);
            this.highlightItemByValue(filePath, text);
        });

        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (!this.tree || !this.tree.visible || !editor) {
                return;
            }

            let doc = editor.document;
            if (!doc) {
                return;
            }

            let filePath = doc.fileName;
            this.updateCurFileData(filePath);

            // // todo: 怎么拿不到光标下的单词？这里总是拿到第一个单词。原因未知
            // let text = getWordAtCursor(editor);
            // // log('光标下的单词', text);
            // this.highlightItemByValue(filePath, text);
        });
    }

    private updateCurFileData(filePath: string) {
        for (var i = this.data.length - 1; i >= 0; i--) {
            let x = this.data[i];
            if (pathEqual(x.bookmark.createdLocation?.uri.path, filePath)) {
                this.curFileData.push(x);
            }
        }
    }

    private highlightItemByValue(filePath: string, value: string) {
        if (!this.tree || !this.tree.visible) {
            return;
        }

        // 当前树中选择的路径是否和指定路径相同
        let isAtCurrentFile = false;
        if (this.tree.selection.length > 0) {
            let cur = this.tree.selection[0];
            if (pathEqual(cur.bookmark.createdLocation?.uri.path, filePath)) {
                isAtCurrentFile = true;
            }
        }

        let targetItem: BookmarkTreeItem | undefined;
        let firstItem: BookmarkTreeItem | undefined;
        for (var i = this.curFileData.length - 1; i >= 0; i--) {
            let x = this.curFileData[i];
            if (pathEqual(x.bookmark.createdLocation?.uri.path, filePath)) {
                if (firstItem == undefined) {
                    firstItem = x;
                }
                if (x.bookmark.value == value) {
                    targetItem = x;
                    break;
                }
            }
        }

        // 不是同一个文件。并且没有找到相同的，取第一个
        if (!isAtCurrentFile && !targetItem) {
            targetItem = firstItem;
        }

        if (!targetItem) {
            return;
        }

        // 高亮显示找到的书签
        this.tree.reveal(targetItem, { focus: false, select: true });
    }

    public setTreeView(t: vscode.TreeView<BookmarkTreeItem>) {
        this.tree = t;
    }

    getParent(element: BookmarkTreeItem): vscode.ProviderResult<BookmarkTreeItem> {
        return undefined;
    }

    public getTreeItem(element: BookmarkTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    public getChildren(
        _element?: BookmarkTreeItem | undefined,
    ): vscode.ProviderResult<BookmarkTreeItem[]> {
        const bookmarks = this._manager.fileTexts;

        const maxLength = `${bookmarks.length}`.length;

        // 创建树中的子节点
        const childs = bookmarks.map((c, index) => {
            return new BookmarkTreeItem(c, index);
        });

        this.data = childs;

        return childs;
    }

    public dispose() {
        this._disposables.forEach((d) => d.dispose());
    }
}

export class BookmarkTreeItem extends vscode.TreeItem {
    constructor(readonly bookmark: IFileTextItem, index: number) {
        super(bookmark.value);

        this.initProperties(index);
    }

    private initProperties(index: number): void {
        if (!this.bookmark.createdLocation) {
            return;
        }

        this.contextValue = 'bookmarkItem:file'; // 用来在package.json中定义when
        this.resourceUri = this.bookmark.createdLocation.uri; // 会自动根据后缀设置前面的图标
        // this.iconPath = createIconPath('string.svg'); // 最前面的图标。如果没有设置，则使用resourceUri对应的文件类型图标

        // 从左到右：文件后缀对应的图标  label description(变暗，缩小显示)
        if (this.bookmark.param) {
            // 快速书签
            this.label = `${this.bookmark.param}) ${this.bookmark.value}`; // 标签)书签名
        } else {
            // 普通书签
            this.label = `${index + 1}) ${this.bookmark.value}`; // 序号)书签名
            if (this.bookmark.extraParam === EXTRA_PARAM_NOT_FOUND) {
                this.label = '❌️' + this.label;
            }
        }
        this.label = compressSpaces(this.label);
        this.description =
            path.basename(this.resourceUri.path) +
            DESCRIPTION_CONNECTOR_SYMBOL +
            this.bookmark.updateCount;
        this.tooltip = `${this.bookmark.value}\nTimes: ${this.bookmark.updateCount}\nPath: ${this.resourceUri.fsPath}`;

        this.command = this.createShowBookmarkInFileCommand();
    }

    private createShowBookmarkInFileCommand(): vscode.Command {
        return {
            // 当选择本项目时，触发的命令
            command: commandList.showBookmarkInFile,
            title: 'Show in the file',
            tooltip: 'Show in the file',
            arguments: [null, this.bookmark],
        };
    }
}
