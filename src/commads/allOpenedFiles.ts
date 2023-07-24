import * as os from "os";
import * as vscode from 'vscode';
import * as path from 'path';
import { commandList, getStoreFolder } from '../global';
import { ShowAllOpenedFilesConfig } from '../config/configuration';
import { FileManager } from '../manager/fileManager';
import { IFileTextItem } from '../manager/common';

let AllOpenedFiles: Array<string> = [];

let config: ShowAllOpenedFilesConfig.Config = { itemWidth: 80 };

interface FileQuickPickItem extends vscode.QuickPickItem {
    fileTextItem: IFileTextItem
}

export class ShowAllOpenedFilesCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    private fileSections = new Map();

    private oldAllOpenedFilesPath = path.join(os.homedir(), ".allOpenedFiles.txt");
    private allOpenedFilesPath = path.join(getStoreFolder(), ".allOpenedFiles.txt");


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
        this.readAllOpenedFiles();
    }

    private readAllOpenedFiles() {
        this.updateAllOpenedFilesFromFile(this.oldAllOpenedFilesPath)
        this.updateAllOpenedFilesFromFile(this.allOpenedFilesPath)
    }

    private updateAllOpenedFilesFromFile(filePath: string) {
        vscode.workspace.openTextDocument(filePath)
            .then((doc: vscode.TextDocument) => {
                let content = doc.getText();
                let files = content.split("\n") // 以换行号分割内容，并返回数组
                AllOpenedFiles.splice(0, 0, ...files); // 合并到全局打开文件数组中

                // 用Set去重
                let fileNameSet = new Set(AllOpenedFiles)
                AllOpenedFiles.length = 0
                AllOpenedFiles.push(...Array.from(fileNameSet))

                for (var i = AllOpenedFiles.length - 1; i >= 0; i--) {
                    let c = AllOpenedFiles[i];
                    const change = this._manager.createChange(undefined, c);
                    change.isJustChangeLocation = true
                    this._manager.addFileText(change);
                }
            }, (err: Error) => {
                console.error(`readAllOpenedFiles error ${filePath} error, ${err}.`);
            }).then(undefined, (err: Error) => {
                console.error(`readAllOpenedFiles error undefined ${filePath} error, ${err}.`);
            })
    }

    protected async execute() {
        let quickPickItems = this.buildFileQuickPickItems(this._manager.fileTexts);
        vscode.window.showQuickPick(quickPickItems, {
            canPickMany: false,
            placeHolder: ""
        }).then(item => {
            if (item) {
                // console.log(`execshowAllOpenedFiles: ${item.fileName}`);
                // insertLineNumber(item.formatConfig, vscode.window.activeTextEditor!.selection);
                // const path = '/Users/somefile.txt';
                const path = item.fileTextItem.value;
                const options = {
                    // 选中第3行第9列到第3行第17列
                    // selection: new vscode.Range(new vscode.Position(2, 8), new vscode.Position(2, 16)),
                    selection: item.fileTextItem.createdLocation?.range,
                    // 是否预览，默认true，预览的意思是下次再打开文件是否会替换当前文件
                    // preview: false,
                    // 显示在第二个编辑器
                    // viewColumn: vscode.ViewColumn.Two
                };
                // vscode.window.open(vscode.Uri.file(path), options);
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

            const change = this._manager.createChange(editor, document.fileName);
            change.ignoreAddCount = true;
            this._manager.addFileText(change);
        })

        vscode.workspace.onDidCloseTextDocument((doc) => {
            let filePath = doc.fileName;
            let extname = path.extname(filePath)
            if (extname = "git") {
                // console.log("", filePath)
                filePath = filePath.slice(0, -4)
            }
            // console.log("onDidCloseTextDocument", filePath)

            const selection = this.fileSections.get(filePath);
            if (!selection) {
                // console.log("onDidCloseTextDocument --------------", filePath)
                return
            }

            // console.log("onDidCloseTextDocument !!!!!!!!!!!!!!!!", filePath)

            const change = this._manager.createChange(undefined, filePath);
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
        // const number = 1234;
        // const width = Math.floor(Math.log10(number));

        const items = fileTexts.map((fileText, i) => {
            let dirName = path.dirname(fileText.value)
            let baseName = path.basename(fileText.value)

            let label = i.toString() + ") " + baseName;
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
            // console.log(i, label.length, description.length, label.length + description.length)

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
