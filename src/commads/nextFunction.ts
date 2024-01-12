import * as vscode from 'vscode';

import { commandList } from '../global';
import { JumpFunctionCommand } from './jumpFunction';

export class NextFunctionCommand extends JumpFunctionCommand {
    constructor() {
        super();

        this._disposable.push(
            vscode.commands.registerCommand(commandList.nextFunction, this.execute, this),
        );
    }

    protected async execute() {
        super.execute(true);
    }
}
