import * as path from 'path';
import * as vscode from 'vscode';
import { commandList } from '../global';
import { AbstractManager } from '../manager/abstractManager';
import { IFileTextItem } from '../manager/common';
import { createIconPath, getWordAtCursor, pathEqual } from '../util/util';

export class BookmarkItem extends vscode.TreeItem {
    constructor(readonly bookmark: IFileTextItem) {
        super(bookmark.value);

        this.contextValue = 'bookmarkItem:';
        this.label = this.bookmark.value.replace(/\s+/g, ' ').trim(); // 设置label
        // 如果对应的书签已经不存在了，在前面加 ------
        if (this.bookmark.extraParam == 'not found') {
            this.label = '------' + this.label;
        }
        this.tooltip = this.bookmark.value;

        this.command = {
            // 当选择本项目时，触发的命令
            command: commandList.showBookmarkInFile,
            title: 'Show in the file',
            tooltip: 'Show in the file',
            arguments: [null, this.bookmark],
        };

        // 从左到右：文件后缀对应的图标  label description(将暗，缩小显示)
        if (this.bookmark.createdLocation) {
            this.resourceUri = this.bookmark.createdLocation.uri; // 会自动根据后缀设置前面的图标
            this.contextValue += 'file';
            this.tooltip = `File: ${this.resourceUri.fsPath}\nValue: ${this.tooltip}\n`;
            this.description = path.basename(this.resourceUri.path) + '---' + bookmark.updateCount;
        } else {
            // 设置项目前面的图标
            this.iconPath = createIconPath('string.svg');
        }
    }
}

export class BookmarkTreeDataProvider
    implements vscode.TreeDataProvider<BookmarkItem>, vscode.Disposable
{
    private _disposables: vscode.Disposable[] = [];

    private _onDidChangeTreeData: vscode.EventEmitter<BookmarkItem | null> =
        new vscode.EventEmitter<BookmarkItem | null>();
    public readonly onDidChangeTreeData: vscode.Event<BookmarkItem | null> =
        this._onDidChangeTreeData.event;

    private tree: vscode.TreeView<BookmarkItem> | undefined;
    private data: BookmarkItem[] = [];

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
            this.autoSelectCurrentFileItems(filePath, text);
        });

        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (!this.tree || !this.tree.visible) {
                return;
            }

            if (!editor) {
                return;
            }

            let doc = editor.document;
            if (doc == undefined) {
                return;
            }

            let filePath = doc.fileName;
            // todo: 怎么拿不到光标下的单词？这里总是拿到第一个单词。原因未知
            let text = getWordAtCursor(editor);
            // log('光标下的单词', text);
            this.autoSelectCurrentFileItems(filePath, text);
        });
    }

    public setTreeView(t: vscode.TreeView<BookmarkItem>) {
        this.tree = t;
    }

    private autoSelectCurrentFileItems(filePath: string, text: string) {
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

        let targetItem;
        let firstItem;
        for (var i = this.data.length - 1; i >= 0; i--) {
            let x = this.data[i];
            if (pathEqual(x.bookmark.createdLocation?.uri.path, filePath)) {
                if (!firstItem) {
                    firstItem = x;
                }
                if (x.bookmark.value == text) {
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
        const childs = bookmarks.map((c, index) => {
            const item = new BookmarkItem(c);
            // const indexNumber = leftPad(index + 1, maxLength, "0");
            const indexNumber = index + 1;

            if (c.param) {
                // 快速书签
                item.label = `${c.param}) ${item.label}`;
            } else {
                // 普通书签
                item.label = `${indexNumber}) ${item.label}`; // 序号)书签名
            }

            return item;
        });

        this.data = childs;

        return childs;
    }

    public dispose() {
        this._disposables.forEach((d) => d.dispose());
    }
}
