import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

import { AllOpenedFiles, commandList, getStoreFolder } from '../global';
import { updateLRUFiles, deleteLRUFiles } from '../util/fileUtil';
import { showErrorMessage } from '../util/errorUtil';
import { ShowAllOpenedFilesConfig } from '../config/configuration';

let config: ShowAllOpenedFilesConfig.Config = { itemWidth: 80 };

interface FileQuickPickItem extends vscode.QuickPickItem {
    filePath: string
}

export class ShowAllOpenedFilesCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    private oldAllOpenedFilesPath = path.join(os.homedir(), ".allOpenedFiles.txt");
    private allOpenedFilesPath = path.join(getStoreFolder(), ".allOpenedFiles.txt");

    constructor() {
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

        this.watchAllOpenedFilesChange();
    }

    protected async execute() {
        let quickPickItems = this.buildFileQuickPickItems(AllOpenedFiles);
        vscode.window.showQuickPick(quickPickItems, {
            canPickMany: false,
            placeHolder: ""
        }).then(item => {
            if (item) {
                // console.log(`execshowAllOpenedFiles: ${item.fileName}`);
                // insertLineNumber(item.formatConfig, vscode.window.activeTextEditor!.selection);
                // const path = '/Users/somefile.txt';
                const path = item.filePath;
                const options = {
                    // 选中第3行第9列到第3行第17列
                    // selection: new vscode.Range(new vscode.Position(2, 8), new vscode.Position(2, 16)),
                    // 是否预览，默认true，预览的意思是下次再打开文件是否会替换当前文件
                    // preview: false,
                    // 显示在第二个编辑器
                    // viewColumn: vscode.ViewColumn.Two
                };
                // vscode.window.open(vscode.Uri.file(path), options);
                vscode.window.showTextDocument(vscode.Uri.file(path), options).then((editor) => {
                    updateLRUFiles(AllOpenedFiles, path);
                    this.saveAllOpenedFiles(AllOpenedFiles)
                }, (err) => {
                    console.log(`Open error, ${err}.`);
                    deleteLRUFiles(AllOpenedFiles, path);
                    this.saveAllOpenedFiles(AllOpenedFiles)
                });
            }
        });

    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }

    private setupConfg() {
        let w = vscode.workspace.getConfiguration("ShowAllOpenedFiles").get<number>("itemWidth");
        if (w == undefined) {
            w = 80
        }
        config.itemWidth = w
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
            }, (err: Error) => {
                console.log(`readAllOpenedFiles error ${filePath} error, ${err}.`);
            }).then(undefined, (err: Error) => {
                console.log(`readAllOpenedFiles error undefined ${filePath} error, ${err}.`);
            })
    }

    private saveAllOpenedFiles(files: Array<string>) {
        const content = files.join("\n"); // 以换行号连接数组
        fs.writeFileSync(this.allOpenedFilesPath, content, 'utf8')
    }

    private watchAllOpenedFilesChange() {
        const watcher = vscode.workspace.createFileSystemWatcher(this.allOpenedFilesPath, false, false, false);
        watcher.onDidChange((e: vscode.Uri) => { // 文件发生更新
            console.log('allOpenedFilesPath changed,', e.fsPath);
        });
        watcher.onDidCreate((e: vscode.Uri) => { // 新建
            console.log('allOpenedFilesPath created,', e.fsPath);
        });
        watcher.onDidDelete((e: vscode.Uri) => { // 删除
            console.log('allOpenedFilesPath deleted,', e.fsPath);
        });
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
            let document = editor?.document
            if (document == undefined) {
                return
            }
            // console.log(`onDidChangeActiveTextEditor ${document.uri.fsPath}`);
            try {
                updateLRUFiles(AllOpenedFiles, document.fileName)
                this.saveAllOpenedFiles(AllOpenedFiles)
            } catch (err) {
                showErrorMessage('onDidChangeActiveTextEditor', err)
            }
        })
    }

    private buildFileQuickPickItems(files: Array<string>): FileQuickPickItem[] {
        let count = files.length
        const number = 1234;
        // const width = Math.floor(Math.log10(number));

        const items = files.map((filePath, i) => {
            let dirName = path.dirname(filePath)
            let baseName = path.basename(filePath)

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
                filePath: filePath,
                label: label,
                description: description,
            } as FileQuickPickItem;
            return item
        });

        return items;
    }
}
