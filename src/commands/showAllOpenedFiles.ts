import * as path from 'path';
import * as vscode from 'vscode';
import { ShowAllOpenedFilesConfig } from '../config/configuration';
import {
    DESCRIPTION_CONNECTOR_SYMBOL,
    GIT_EXT,
    LABEL_CONNECTOR_SYMBOL,
    commandList,
} from '../global';
import { IFileTextItem, createTextChange } from '../manager/common';
import { FileManager } from '../manager/fileManager';
import { createIconPath, isOpenPathLegal } from '../util/util';

const MAX_RECENT_FILES = 20;

// todo: 自动获取宽度
let config: ShowAllOpenedFilesConfig.Config = { itemWidth: 80 };

export class ShowAllOpenedFilesCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    private fileSections = new Map(); // 文件光标位置.以便下次打开时，直接跳到该位置

    constructor(protected _manager: FileManager) {
        this._disposable.push(
            vscode.commands.registerCommand(commandList.showAllOpenedFiles, this.execute, this),
        );

        this.setupConfig();
        vscode.workspace.onDidChangeConfiguration((event) => {
            let affected = event.affectsConfiguration('ShowAllOpenedFiles.itemWidth');
            if (affected) {
                this.setupConfig();
            }
        });

        this.watchFileOpen();
    }

    protected async execute() {
        /*
        const qpOptions = { title: "demos of iconPaths", canPickMany: false };
        let iconPath22 = createIconPath("remove.svg");
        let iconPath2 = createIconPath("string.svg");
        const qpItems = [
            { label: "first item", iconPath: iconPath22, buttons: [deleteButton], },
            { label: "second item", iconPath: iconPath2 },
            { label: "third item", iconPath: "C:\\Users\\Mark\\folder-operations\\images\\camera.svg" },
            { label: "fourth item", iconPath: "C:\\Users\\Mark\\\folder-operations\\images\\github.svg" },
            { label: "fifth item", iconPath: "C:\\Users\\Mark\\folder-operations\\images\\mail.svg" }
        ];
        const selectedItem = await vscode.window.showQuickPick(qpItems, qpOptions);
        */

        // 在快速输入框的上面会显示标题。并在标题栏的右边显示删除按钮
        let deleteButton: vscode.QuickInputButton = {
            iconPath: createIconPath('remove.svg'),
            tooltip: 'delete',
        };

        let quickPick = vscode.window.createQuickPick();
        quickPick.items = this.createPicks();
        quickPick.buttons = [deleteButton];
        quickPick.onDidAccept(() => {
            quickPick.hide();
            const item = quickPick.selectedItems[0] as FileQuickPickItem;
            if (item) {
                this.showPickItem(item);
            }
        });
        quickPick.placeholder = 'Select to open...';
        quickPick.title = 'All Opened Files';
        quickPick.onDidTriggerButton((e: vscode.QuickInputButton) => {
            const item = quickPick.activeItems[0] as FileQuickPickItem;
            if (item) {
                this._manager.remove(item.fileTextItem);
                vscode.window.showWarningMessage('delete ' + item.fileTextItem.value);
            }
        });
        quickPick.show();
    }

    private showPickItem(item: FileQuickPickItem) {
        const path = item.fileTextItem.value;
        const options = {
            selection: item.fileTextItem.createdLocation?.range,
            // 是否预览，默认true，预览的意思是下次再打开文件是否会替换当前文件
            // preview: false,
            // 显示在第二个编辑器
            // viewColumn: vscode.ViewColumn.Two
        };
        vscode.window.showTextDocument(vscode.Uri.file(path), options).then(
            (editor) => {
                // this._manager.updateFileText(path);
            },
            (err) => {
                this._manager.removeFileText(path);
            },
        );
    }

    private createPicks(): FileQuickPickItem[] {
        const fileTexts = this._manager.fileTexts;

        const picks = fileTexts.map((fileText, i) => {
            let weight = 0;
            if (i < MAX_RECENT_FILES) {
                weight = 10000 * (MAX_RECENT_FILES - i) + fileText.updateCount;
            } else {
                weight = fileText.updateCount;
            }
            const item: FileQuickPickItem = {
                fileTextItem: fileText,
                label: '',
                weight: weight,
            };
            return item;
        });

        picks.sort((a: FileQuickPickItem, b: FileQuickPickItem) => {
            // let ta = a.fileTextItem.updateCount;
            // let tb = b.fileTextItem.updateCount;
            // return tb - ta;
            return b.weight - a.weight;
        });

        picks.forEach((pick, i) => {
            const fileText = pick.fileTextItem;
            const dirName = path.dirname(fileText.value);
            const baseName = path.basename(fileText.value);

            const label = i.toString() + LABEL_CONNECTOR_SYMBOL + baseName;
            let description = dirName;
            let updateCountStr = DESCRIPTION_CONNECTOR_SYMBOL + fileText.updateCount.toString();

            // 调整宽度与显示
            const cfgWidth = config.itemWidth;
            const prefix = '...';
            const tmpWidth = label.length + description.length + updateCountStr.length;
            if (tmpWidth > cfgWidth) {
                let charToFind = '\\';
                let firstPosition = description.indexOf(charToFind);
                let secondPosition = -1;
                if (firstPosition != -1) {
                    // 如果找到了指定字符
                    secondPosition = description.indexOf(charToFind, firstPosition + 1);
                    if (secondPosition != -1) {
                        // 如果找到了第二个指定字符
                        secondPosition++;
                    } else {
                        secondPosition = 10;
                    }
                } else {
                    secondPosition = 10;
                }

                let tle = cfgWidth - label.length - prefix.length - updateCountStr.length;
                if (tle > 0) {
                    let toDeleteLen = description.length - tle;
                    description =
                        description.substring(0, secondPosition) +
                        prefix +
                        description.substring(secondPosition + toDeleteLen) +
                        updateCountStr;
                    // description = prefix + description.slice(-tle) + updateCountStr;
                } else {
                    description = prefix + description + updateCountStr;
                }
            } else {
                description = description + updateCountStr;
            }

            pick.label = label;
            pick.description = description;
        });

        return picks;
    }

    private setupConfig() {
        let w = vscode.workspace.getConfiguration('ShowAllOpenedFiles').get<number>('itemWidth');
        if (w == undefined) {
            w = 80;
        }
        config.itemWidth = w;
    }

    private watchFileOpen() {
        vscode.workspace.onDidOpenTextDocument((doc: vscode.TextDocument) => {
            let filePath = doc.fileName;
            // console.log(`onDidOpenTextDocument  ${filePath}`);

            if (!isOpenPathLegal(filePath)) {
                return;
            }

            let item = this._manager.getFileText(filePath);
            if (item) {
                this._manager.updateFileText(filePath);
            } else {
                const editor = vscode.window.activeTextEditor;
                const change = createTextChange(editor, filePath);
                this._manager.addFileText(change);
            }
        });

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

            let extname = path.extname(filePath);
            if (GIT_EXT == extname) {
                filePath = filePath.slice(0, -GIT_EXT.length);
                // return
            }

            // console.log(`onDidCloseTextDocument 2  ${filePath}`);

            const selection = this.fileSections.get(filePath);
            if (!selection) {
                return;
            }

            let item = this._manager.getFileText(filePath);
            if (!item) {
                return;
            }

            if (!item.createdLocation) {
                item.createdLocation = {
                    range: new vscode.Range(selection.start, selection.end),
                    uri: vscode.Uri.file(filePath),
                };
            } else {
                item.createdLocation.range = new vscode.Range(selection.start, selection.end);
            }

            this._manager.updateFileTextByItem(item);
        });

        vscode.window.onDidChangeTextEditorSelection((e) => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            let document = editor.document;
            if (!document) {
                return;
            }

            this.fileSections.set(document.fileName, editor.selection);
        });
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }
}

interface FileQuickPickItem extends vscode.QuickPickItem {
    fileTextItem: IFileTextItem;
    weight: number;
}
