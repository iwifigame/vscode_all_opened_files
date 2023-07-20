import * as vscode from "vscode";
import { ClipboardManager } from "../manager";
import { leftPad } from "../util/util";
import { commandList } from "./common";
import { ClipPickItem } from "./pickAndPaste";

const Start_Index: number = 0;

export class RingPasteCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];
    private curIndex: number = Start_Index;
    private lastPasteTime: number = Date.now();
    private needUndo: boolean = false;

    constructor(protected _manager: ClipboardManager) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.ringPaste,
                this.execute,
                this
            )
        );
    }

    protected async execute() {
        if (this.needUndo) {
            vscode.commands.executeCommand("undo");
        }

        let curPasteTime = Date.now();
        if ((curPasteTime - this.lastPasteTime) > 2000) {
            this.curIndex = Start_Index;
            this.needUndo = false;
        }
        this.lastPasteTime = Date.now();

        // 得到所有剪贴板
        const clips = this._manager.clips;

        const maxLength = `${clips.length}`.length; // 列表长度转成字符串，再取长度。即最大数字长度

        // 创建快速选择项目
        const picks = clips.map((c, index) => {
            const item = new ClipPickItem(c);
            const indexNumber = leftPad(index + 1, maxLength, "0");

            item.label = `${indexNumber}) ${item.label}`;

            return item;
        });

        // 设置选择事件处理
        let ringPaste = (selected: ClipPickItem) => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                // 定义替换成选择的剪贴板内容的方法
                const replace = () =>
                    editor.edit(
                        edit => {
                            for (const selection of editor.selections) {
                                // console.log("------------ccccccc ", selection);
                                edit.replace(selection, selected.clip.value); // 替换成选择的剪贴板内容
                            }
                            this.needUndo = true;
                        },
                        {
                            undoStopAfter: false,
                            undoStopBefore: false,
                        }
                    );

                const selections: vscode.Selection[] = [];
                if (editor.selections.every(s => s.isEmpty)) { // 没有选择内容处理
                    editor.edit(
                        edit => {
                            for (const selection of editor.selections) {
                                edit.insert(selection.start, " ");
                                selections.push(
                                    new vscode.Selection(
                                        selection.start.line,
                                        selection.start.character,
                                        selection.start.line,
                                        selection.start.character + 1
                                    )
                                );
                            }
                        },
                        {
                            undoStopAfter: false,
                            undoStopBefore: false,
                        }
                    ).then(() => {
                        if (selections.length > 0) {
                            editor.selections = selections;
                            // console.log("------------aaaaaa ", selections);
                        }
                    }).then(replace);
                } else { // 选择了内容，则替换
                    replace();
                    // console.log("------------bbbbb", selections);
                }
            }
        };

        const pick = picks[this.curIndex];
        ringPaste(pick);

        this.curIndex++;
        if (this.curIndex >= clips.length) {
            this.curIndex = 0;
        }
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}