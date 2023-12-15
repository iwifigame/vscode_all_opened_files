import * as vscode from 'vscode';
import { commandList } from '../global';
import { ClipboardManager } from '../manager/clipboardManager';
import { IFileTextItem } from '../manager/common';
import { createIconPath, dateFormat, leftPad } from '../util/util';

export class ClipHistoryItem extends vscode.TreeItem {
    constructor(readonly clip: IFileTextItem) {
        super(clip.value);

        this.contextValue = 'clipHistoryItem:';
        this.label = this.clip.value.replace(/\s+/g, ' ').trim(); // 多个空白字符，转成一个空格
        this.tooltip = this.clip.value;

        this.command = {
            command: commandList.showClipboardInFile,
            title: 'Show in the file',
            tooltip: 'Show in the file',
            arguments: [this],
        };

        if (this.clip.createdLocation) {
            this.resourceUri = this.clip.createdLocation.uri;
            this.contextValue += 'file';

            this.tooltip = `File: ${this.resourceUri.fsPath}\nValue: ${this.tooltip}\n`;
        } else {
            this.iconPath = createIconPath('string.svg');
        }
    }
}

export class ClipboardTreeDataProvider
    implements vscode.TreeDataProvider<ClipHistoryItem>, vscode.Disposable
{
    private _disposables: vscode.Disposable[] = [];

    private _onDidChangeTreeData: vscode.EventEmitter<ClipHistoryItem | null> =
        new vscode.EventEmitter<ClipHistoryItem | null>();
    public readonly onDidChangeTreeData: vscode.Event<ClipHistoryItem | null> =
        this._onDidChangeTreeData.event;

    constructor(protected _manager: ClipboardManager) {
        this._manager.onDidChangeFileTextList(() => {
            this._onDidChangeTreeData.fire(null);
        });
    }

    public getTreeItem(element: ClipHistoryItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    public getChildren(
        _element?: ClipHistoryItem | undefined,
    ): vscode.ProviderResult<ClipHistoryItem[]> {
        const clips = this._manager.fileTexts;

        const maxLength = `${clips.length}`.length;

        const childs = clips.map((c, index) => {
            const item = new ClipHistoryItem(c);
            const indexNumber = leftPad(index + 1, maxLength, '0');

            item.label = `${indexNumber}) ${item.label}`;
            let d = new Date(item.clip.createdAtString);
            item.description = `${dateFormat(d, 'MM-dd hh:mm:ss')}`;

            return item;
        });

        return childs;
    }

    public dispose() {
        this._disposables.forEach((d) => d.dispose());
    }
}
