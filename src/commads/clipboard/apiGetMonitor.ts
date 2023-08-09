import * as vscode from "vscode";
import { commandList } from "../../global";
import { ClipboardMonitor } from "../../manager/clipboardMonitor";

export class ApiGetMonitor implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected monitor: ClipboardMonitor) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.apiGetMonitor,
                this.execute,
                this
            )
        );
    }

    protected async execute() {
        return this.monitor;
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
