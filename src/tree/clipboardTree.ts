import * as vscode from 'vscode';
import { commandList } from '../global';
import { ClipboardManager } from '../manager/clipboardManager';
import { IFileTextItem } from '../manager/common';
import { compressSpaces, dateFormat } from '../util/util';

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
        const childs = clips.map((c, index) => {
            return new ClipHistoryItem(c, index);
        });

        return childs;
    }

    public dispose() {
        this._disposables.forEach((d) => d.dispose());
    }
}

export class ClipHistoryItem extends vscode.TreeItem {
    constructor(readonly clip: IFileTextItem, index: number) {
        super(clip.value);

        this.initProperties(index);
    }

    private initProperties(index: number): void {
        if (!this.clip.createdLocation) {
            return;
        }

        this.contextValue = 'clipHistoryItem:file';
        this.resourceUri = this.clip.createdLocation.uri;

        const indexNumber = index + 1;
        this.label = `${indexNumber}) ${this.clip.value}`;
        this.label = compressSpaces(this.label);
        let d = new Date(this.clip.createdAtString);
        this.description = `${dateFormat(d, 'MM-dd hh:mm:ss')}`;
        this.tooltip = `${this.clip.value}\n\nTime: ${dateFormat(d, 'MM-dd hh:mm:ss')}\nPath: ${
            this.resourceUri.fsPath
        }`;

        this.command = this.createShowClipboardCommand();
    }

    private createShowClipboardCommand() {
        return {
            command: commandList.showClipboardInFile,
            title: 'Show in the file',
            tooltip: 'Show in the file',
            arguments: [this],
        };
    }
}
