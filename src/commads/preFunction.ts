import * as vscode from 'vscode';

import { commandList } from '../global';
import { JumpFunctionCommand } from './jumpFunction';

export class PreFunctionCommand extends JumpFunctionCommand {
    constructor() {
        super();

        this._disposable.push(
            vscode.commands.registerCommand(commandList.preFunction, this.execute, this),
        );
    }

    protected async execute() {
        super.execute(false);
    }
}
