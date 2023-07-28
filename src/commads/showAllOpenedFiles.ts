import * as vscode from 'vscode';
import * as os from "os";
import * as path from 'path';
import { commandList, getStoreFolder } from '../global';
import { ShowAllOpenedFilesConfig } from '../config/configuration';
import { IFileTextItem, createChange } from '../manager/common';
import { FileManager } from '../manager/fileManager';

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
                    this._manager.updateFileText(path);
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
        // 不使用这个方法，打开文件时，会多很多git等没有打开的文件
        // vscode.workspace.onDidOpenTextDocument((document: TextDocument) => {
        //     console.log(`onDidOpenTextDocument  ${document.uri.fsPath}`);
        //     // const editor = vscode.window.activeTextEditor
        //     try {
        //         updateFileNameArr(fileNameArr, document.fileName)
        //     } catch (err) {
        //         handleError.showErrorMessage('fileHeader: watchSaveFn', err)
        //     }
        // })

        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (!editor) {
                return
            }

            let document = editor.document
            if (document == undefined) {
                return
            }

            const change = createChange(editor, document.fileName);
            change.ignoreAddCount = true;
            this._manager.addFileText(change);
        })

        vscode.workspace.onDidCloseTextDocument((doc) => {
            let filePath = doc.fileName;
            let extname = path.extname(filePath)
            if (extname = "git") {
                filePath = filePath.slice(0, -4)
            }

            const selection = this.fileSections.get(filePath);
            if (!selection) {
                return
            }

            const change = createChange(undefined, filePath);
            change.isJustChangeLocation = true;
            change.createdLocation = {
                range: new vscode.Range(selection.start, selection.end),
                uri: doc.uri,
            };
            this._manager.addFileText(change);
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

            // 调整宽度与显示
            const itemWidth = config.itemWidth;
            const prefix = "   ...";
            const wholeWidth = label.length + description.length + prefix.length
            if (wholeWidth > itemWidth) {
                let tle = itemWidth - label.length - prefix.length
                if (tle > 0) {
                    description = prefix + description.slice(-tle);
                } else {
                    description = prefix
                }
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
