import * as vscode from 'vscode';
import { commandList } from '../../global';
import { ClipboardManager } from '../../manager/clipboardManager';
import { IFileTextItem } from '../../manager/common';
import { compressSpaces, leftPad } from '../../util/util';

export class PickAndPasteCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected _manager: ClipboardManager) {
        this._disposable.push(
            vscode.commands.registerCommand(commandList.pickAndPaste, this.execute, this),
        );
    }

    protected async execute() {
        const config = vscode.workspace.getConfiguration('ClipManager');
        const preview = config.get('preview', true);

        // 得到所有剪贴板
        const clips = this._manager.fileTexts;

        const maxLength = `${clips.length}`.length; // 列表长度转成字符串，再取长度。即最大数字长度

        // 创建快速选择项目
        const picks = clips.map((c, index) => {
            return new ClipQuickPickItem(c, maxLength, index);
        });

        // Variable to check changes in document by preview
        let needUndo = false;

        const options: vscode.QuickPickOptions = {
            placeHolder: 'Select one clip to paste. ESC to cancel.',
        };

        /**
         * If preview is enabled, get current text editor and replace
         * current selecion.
         * NOTE: not need paste if the text is replaced
         */
        if (preview) {
            // 配置了预览
            // 设置选择事件处理
            options.onDidSelectItem = async (selected: ClipQuickPickItem) => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    // 定义替换成选择的剪贴板内容的方法
                    const replace = () =>
                        editor.edit(
                            (edit) => {
                                for (const selection of editor.selections) {
                                    edit.replace(selection, selected.clip.value); // 替换成选择的剪贴板内容
                                }
                                needUndo = true; // 需要回退true
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
                                if (selections.length > 0) {
                                    editor.selections = selections;
                                }
                            })
                            .then(replace);
                    } else {
                        // 选择了内容，则替换
                        replace();
                    }
                }
            };
        }

        const pick = await vscode.window.showQuickPick(picks, options); // 显示快速选择框

        if (!pick) {
            // 没有选择
            if (needUndo) {
                // 需要回退
                return await vscode.commands.executeCommand('undo');
            }
            return;
        }

        // Update current clip in clipboard
        await this._manager.updateFileText(pick.clip.value);

        // If text changed, only need remove selecion
        // If a error occur on replace, run paste command for fallback
        if (needUndo) {
            // 选择了项目，则要将选择区域取消
            // Fix editor selection
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selecions = editor.selections.map((s) => new vscode.Selection(s.end, s.end));
                editor.selections = selecions;
            } else {
                return await vscode.commands.executeCommand('cancelSelection');
            }
        } else {
            return await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        }
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }
}

// 剪贴板快速选择项目
export class ClipQuickPickItem implements vscode.QuickPickItem {
    public label: string;

    constructor(readonly clip: IFileTextItem, maxLength: number, index: number) {
        const indexNumber = leftPad(index + 1, maxLength, '0');
        const label = `${indexNumber}) ${this.clip.value}`;
        this.label = compressSpaces(label);
    }

    get description() {
        if (this.clip.updatedAtString) {
            return this.clip.updatedAtString;
        }
    }
}
