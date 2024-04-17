import * as vscode from 'vscode';
import { commandList } from '../../global';
import { ClipboardManager } from '../../manager/clipboardManager';
import { IFileTextItem } from '../../manager/common';

const Start_Index: number = 0;

export class RingPasteCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];
    private curIndex: number = Start_Index;
    private lastPasteTime: number = Date.now();
    private needUndo: boolean = false;

    constructor(protected _manager: ClipboardManager) {
        this._disposable.push(
            vscode.commands.registerCommand(commandList.ringPaste, this.execute, this),
        );
    }

    protected async execute() {
        let curPasteTime = Date.now();
        if (curPasteTime - this.lastPasteTime > 2000) {
            this.curIndex = Start_Index;
            this.needUndo = false;
        }
        this.lastPasteTime = Date.now();

        // if (this.needUndo) {
        //     vscode.commands.executeCommand("undo");
        // }

        // 得到所有剪贴板
        const picks = this._manager.fileTexts;

        // 设置选择事件处理
        let ringPasteFun = (selected: IFileTextItem) => {
            // console.log("------------ccccccc 1 ", selected.value);
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                // console.log("------------ccccccc 2 ", selected.value);
                return;
            }

            // 定义替换成选择的剪贴板内容的方法
            const replace = () =>
                editor.edit(
                    (edit) => {
                        for (const selection of editor.selections) {
                            // console.log("------------ccccccc 333333 ", selected.value);
                            edit.replace(selection, selected.value); // 替换成选择的剪贴板内容
                        }
                        this.needUndo = true;
                    },
                    {
                        undoStopAfter: false,
                        undoStopBefore: false,
                    },
                );

            const selections: vscode.Selection[] = [];
            if (editor.selections.every((s) => s.isEmpty)) {
                // 没有选择内容处理
                editor
                    .edit(
                        (edit) => {
                            // console.log("------------ccccccc 5 ", selected.value);
                            for (const selection of editor.selections) {
                                edit.insert(selection.start, ' ');
                                selections.push(
                                    new vscode.Selection(
                                        selection.start.line,
                                        selection.start.character,
                                        selection.start.line,
                                        selection.start.character + 1,
                                    ),
                                );
                            }
                        },
                        {
                            undoStopAfter: false,
                            undoStopBefore: false,
                        },
                    )
                    .then(() => {
                        // console.log("------------ccccccc 4 ", selected.value);
                        if (selections.length > 0) {
                            editor.selections = selections;
                            // console.log("------------aaaaaa ", selections);
                        }
                    })
                    .then(replace);
            } else {
                // 选择了内容，则替换
                // console.log("------------ccccccc 6 ", selected.value);
                replace();
                // console.log("------------ccccccc 7 ", selected.value);
                // console.log("------------bbbbb", selections);
            }
        };

        const pick = picks[this.curIndex];
        ringPasteFun(pick);

        this.curIndex++;
        // console.log("ringPaste==========", this.curIndex)
        if (this.curIndex >= picks.length) {
            this.curIndex = 0;
        }
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }
}
