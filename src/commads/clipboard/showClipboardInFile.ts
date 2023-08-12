import * as vscode from "vscode";
import { ClipHistoryItem } from "../../tree/clipboardTree";
import { commandList } from "../../global";
import { ClipboardManager } from "../../manager/clipboardManager";
import { showFileTextItem } from "../../manager/common";

export class ShowClipboardInFileCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected _manager: ClipboardManager) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.showClipboardInFile,
                this.execute,
                this
            )
        );
    }

    protected async execute(item: ClipHistoryItem) {
        const clip = item.clip;

        if (!clip.createdLocation) {
            return;
        }

        showFileTextItem(clip, this._manager)
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
