import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

import { AllOpenedFiles } from './global';
import { updateLRUFiles, deleteLRUFiles } from './fileUtils';
import { showErrorMessage } from './handleError';
import { ShowAllOpenedFilesConfig } from './configuration';

const oldAllOpenedFilesPath = path.join(os.homedir(), "allOpenedFiles.txt");
const allOpenedFilesPath = path.join(os.homedir(), ".allOpenedFiles.txt");

let config: ShowAllOpenedFilesConfig.Config = { itemWidth: 80 };

export function onActivate() {
    setupConfg();
    vscode.workspace.onDidChangeConfiguration(event => {
        let affected = event.affectsConfiguration("ShowAllOpenedFiles.itemWidth");
        if (affected) {
            setupConfg();
        }
    })

    watchFileOpen();
    readAllOpenedFiles();

    watchAllOpenedFilesChange();

}

function setupConfg() {
    let w = vscode.workspace.getConfiguration("ShowAllOpenedFiles").get<number>("itemWidth");
    if (w == undefined) {
        w = 80
    }
    config.itemWidth = w
}

export function execShowAllOpenedFiles() {
    let quickPickItems = buildFileQuickPickItems(AllOpenedFiles);
    vscode.window.showQuickPick(quickPickItems, {
        canPickMany: false,
        placeHolder: ""
    }).then(item => {
        if (item) {
            console.log(`execshowAllOpenedFiles: ${item.fileName}`);
            // insertLineNumber(item.formatConfig, vscode.window.activeTextEditor!.selection);
            // const path = '/Users/somefile.txt';
            const path = item.fileName;
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
                saveAllOpenedFiles(AllOpenedFiles)
            }, (err) => {
                console.log(`Open error, ${err}.`);
                deleteLRUFiles(AllOpenedFiles, path);
                saveAllOpenedFiles(AllOpenedFiles)
            });
        }
    });
}

function readAllOpenedFiles() {
    updateAllOpenedFilesFromFile(oldAllOpenedFilesPath)
    updateAllOpenedFilesFromFile(allOpenedFilesPath)
}

function updateAllOpenedFilesFromFile(filePath: string) {
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

function saveAllOpenedFiles(files: Array<string>) {
    const content = files.join("\n"); // 以换行号连接数组
    fs.writeFileSync(allOpenedFilesPath, content, 'utf8')
}

function watchAllOpenedFilesChange() {
    const watcher = vscode.workspace.createFileSystemWatcher(allOpenedFilesPath, false, false, false);
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

function watchFileOpen() {
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
        console.log(`onDidChangeActiveTextEditor ${document.uri.fsPath}`);
        try {
            updateLRUFiles(AllOpenedFiles, document.fileName)
            saveAllOpenedFiles(AllOpenedFiles)
        } catch (err) {
            showErrorMessage('onDidChangeActiveTextEditor', err)
        }
    })
}

interface FileQuickPickItem extends vscode.QuickPickItem {
    fileName: string
}

function buildFileQuickPickItems(files: Array<string>): FileQuickPickItem[] {
    let count = files.length
    const number = 1234;
    // const width = Math.floor(Math.log10(number));

    const items = files.map((path, i) => {
        let showPath = path;

        const itemWidth = config.itemWidth;
        if (path.length > itemWidth) {
            showPath = '...' + path.slice(-itemWidth);
        }

        let item = {
            fileName: path,
            // label: i.toString().padStart(width, '0') + ")" + showPath,
            label: i.toString() + ")" + showPath,
            // description: "--- " + i.toString(),
        } as FileQuickPickItem;
        return item
    });

    return items;
}

export async function execQuickOpen(filePath: string, line: Number = 0, character: Number = 0) {
    try {
        const activeTextEditor = vscode.window.activeTextEditor;
        if (activeTextEditor == undefined) {
            return
        }
        if (activeTextEditor.document.fileName !== filePath) {
            const homedir = require("os").homedir();
            if (filePath.includes("~")) {
                filePath = path.join(homedir, filePath.replace("~", ""));
            }
            const doc = await vscode.workspace.openTextDocument(
                vscode.Uri.file(filePath)
            );
            const editor = await vscode.window.showTextDocument(doc);
            revealEditorPosition(editor, line, character);
        }
    } catch (error: any) {
        console.error(`error:`, error);
        vscode.window.showErrorMessage(error.message);
    }
}

function revealEditorPosition(editor: any, line: any, character: any) {
    if (!line) return;
    character = character || 1;
    const position = new vscode.Position(line - 1, character - 1);
    editor.selections = [new vscode.Selection(position, position)];
    editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenterIfOutsideViewport
    );
}
