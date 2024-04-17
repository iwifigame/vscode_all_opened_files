import * as vscode from 'vscode';
import { commandList } from '../../global';
import { QuickBookmarkManager } from '../../manager/quickBookmarkManager';
import { decoration } from '../../util/decorationUtil';

export class ClearQuickBookmarkCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected _quickManager: QuickBookmarkManager) {
        this._disposable.push(
            vscode.commands.registerCommand(commandList.clearQuickBookmark, this.execute, this),
        );
    }

    protected async execute() {
        this._quickManager.clearAll();
        decoration.clearMarkDecoration();
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }
}
