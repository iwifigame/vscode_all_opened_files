import * as vscode from 'vscode';
import { ClipHistoryItem } from '../../tree/clipboardTree';
import { commandList } from '../../global';
import { ClipboardManager } from '../../manager/clipboardManager';

export class RemoveClipboardHistoryCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected _manager: ClipboardManager) {
        this._disposable.push(
            vscode.commands.registerCommand(commandList.removeClipboardHistory, this.execute, this),
        );
    }

    protected async execute(value: string | ClipHistoryItem) {
        if (value instanceof ClipHistoryItem) {
            value = value.clip.value;
        }

        await this._manager.removeFileText(value);
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }
}
