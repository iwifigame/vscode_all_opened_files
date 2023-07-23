import * as vscode from "vscode";
import { ClipboardMonitor } from "./clipboardMonitor";
import { AbstractManager } from "./abstractManager";

export class ClipboardManager extends AbstractManager {
    constructor(protected context: vscode.ExtensionContext, protected _monitor: ClipboardMonitor) {
        super(context);
        this._monitor.onDidChangeText(this.addFileText, this, this._disposable);
    }

    getConfigName(): string {
        return "ClipboardManager";
    }
}
