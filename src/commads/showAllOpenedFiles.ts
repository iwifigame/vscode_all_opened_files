import * as vscode from 'vscode';
import * as path from 'path';
import { GIT_EXT, commandList, getStoreFolder } from '../global';
import { ShowAllOpenedFilesConfig } from '../config/configuration';
import { IFileTextItem, createChange } from '../manager/common';
import { FileManager } from '../manager/fileManager';
import { isOpenPathlegal } from '../util/util';

// todo: 自动获取宽度
let config: ShowAllOpenedFilesConfig.Config = { itemWidth: 80 };

interface FileQuickPickItem extends vscode.QuickPickItem {
    fileTextItem: IFileTextItem
}

export class ShowAllOpenedFilesCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    private fileSections = new Map(); // 文件光标位置.以便下次打开时，直接跳到该位置

    constructor(protected _manager: FileManager) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.showAllOpenedFiles,
                this.execute,
                this
            )
        );

        this.setupConfg();
        vscode.workspace.onDidChangeConfiguration(event => {
            let affected = event.affectsConfiguration("ShowAllOpenedFiles.itemWidth");
            if (affected) {
                this.setupConfg();
            }
        })

        this.watchFileOpen();
    }

    protected async execute() {
        let quickPickItems = this.buildFileQuickPickItems(this._manager.fileTexts);
        vscode.window.showQuickPick(quickPickItems, {
            canPickMany: false,
            placeHolder: ""
        }).then(item => {
            if (item) {
                // console.log(`execshowAllOpenedFiles: ${item.fileName}`);
                const path = item.fileTextItem.value;
                const options = {
                    selection: item.fileTextItem.createdLocation?.range,
                    // 是否预览，默认true，预览的意思是下次再打开文件是否会替换当前文件
                    // preview: false,
                    // 显示在第二个编辑器
                    // viewColumn: vscode.ViewColumn.Two
                };
                vscode.window.showTextDocument(vscode.Uri.file(path), options).then((editor) => {
                    // this._manager.updateFileText(path);
                }, (err) => {
                    this._manager.removeFileText(path)
                });
            }
        });
    }

    private setupConfg() {
        let w = vscode.workspace.getConfiguration("ShowAllOpenedFiles").get<number>("itemWidth");
        if (w == undefined) {
            w = 80
        }
        config.itemWidth = w
    }

    private watchFileOpen() {
        vscode.workspace.onDidOpenTextDocument((doc: vscode.TextDocument) => {
            let filePath = doc.fileName;
            // console.log(`onDidOpenTextDocument  ${filePath}`);

            if (!isOpenPathlegal(filePath)) {
                return
            }

            let item = this._manager.getFileText(filePath);
            if (item) {
                this._manager.updateFileText(filePath);
            } else {
                const editor = vscode.window.activeTextEditor
                const change = createChange(editor, filePath);
                this._manager.addFileText(change);
            }
        })

        /*
        // 当编辑器更改时触发。切换已打开的文件也会触发
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (!editor) {
                return
            }

            let doc = editor.document
            if (doc == undefined) {
                return
            }

            let item = this._manager.getFileText(doc.fileName);
            if (item) {
                this._manager.updateFileText(doc.fileName);
            } else {
                const change = createChange(editor, doc.fileName);
                this._manager.addFileText(change);
            }
        })
        */

        vscode.workspace.onDidCloseTextDocument((doc) => {
            let filePath = doc.fileName;
            // console.log(`onDidCloseTextDocument  ${filePath}`);

            let extname = path.extname(filePath)
            if (GIT_EXT == extname) {
                filePath = filePath.slice(0, -GIT_EXT.length)
                // return
            }

            // console.log(`onDidCloseTextDocument 2  ${filePath}`);

            const selection = this.fileSections.get(filePath);
            if (!selection) {
                return
            }

            let item = this._manager.getFileText(filePath);
            if (!item) {
                return
            }

            if (!item.createdLocation) {
                item.createdLocation = {
                    range: new vscode.Range(selection.start, selection.end),
                    uri: vscode.Uri.file(filePath),
                };
            } else {
                item.createdLocation.range = new vscode.Range(selection.start, selection.end)
            }

            this._manager.updateFileTextByItem(item);
        })

        vscode.window.onDidChangeTextEditorSelection((e) => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return
            }

            let document = editor.document
            if (!document) {
                return
            }

            this.fileSections.set(document.fileName, editor.selection)
        });
    }

    private buildFileQuickPickItems(fileTexts: Array<IFileTextItem>): FileQuickPickItem[] {
        let count = fileTexts.length

        const items = fileTexts.map((fileText, i) => {
            const dirName = path.dirname(fileText.value)
            const baseName = path.basename(fileText.value)

            const label = i.toString() + ") " + baseName;
            let description = dirName;
            let updateCountStr = "  " + fileText.updateCount.toString();

            // 调整宽度与显示
            const cfgWidth = config.itemWidth;
            const prefix = "   ...";
            const tmpWidth = label.length + description.length + updateCountStr.length
            if (tmpWidth > cfgWidth) {
                const wholeWidth = label.length + description.length + prefix.length + updateCountStr.length
                let tle = cfgWidth - label.length - prefix.length - updateCountStr.length
                if (tle > 0) {
                    description = prefix + description.slice(-tle) + updateCountStr;
                } else {
                    description = prefix + description + updateCountStr
                }
            } else {
                description = description + updateCountStr
            }

            let item = {
                fileTextItem: fileText,
                label: label,
                description: description,
            } as FileQuickPickItem;
            return item
        });

        return items;
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
