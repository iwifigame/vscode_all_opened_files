import * as vscode from 'vscode';
import { AbstractManager } from './abstractManager';
import { ClipboardMonitor } from './clipboardMonitor';
import { IFileTextItem } from './common';

export class ClipboardManager extends AbstractManager {
    constructor(protected _monitor: ClipboardMonitor) {
        super();
        // 当剪贴板内容修改时，添加记录
        this._monitor.onDidChangeText(this.addFileText, this, this._disposable);

        // 当manager中的内容修改时，写入剪贴板
        this.onDidChangeFileTextList((item: IFileTextItem) => {
            if (item) {
                this._monitor.clipboard.writeText(item.value);
            }
        });
    }

    getConfigName(): string {
        return 'ClipManager';
    }

    protected get maxfileTexts(): number {
        const config = vscode.workspace.getConfiguration(this.getConfigName());
        return config.get('maxfileTexts', 1000);
    }

    protected get moveToTop(): boolean {
        return false;
    }
}
