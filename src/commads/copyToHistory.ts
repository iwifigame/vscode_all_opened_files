import * as vscode from "vscode";
import { commandList } from "../global";
import { ClipboardMonitor } from "../manager/clipboardMonitor";

export class CopyToHistoryCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected monitor: ClipboardMonitor) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.copyToHistory,
                this.execute,
                this
            )
        );
    }

    protected async execute() {
        await vscode.commands.executeCommand("editor.action.clipboardCopyAction");
        await this.monitor.checkChangeText();
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
