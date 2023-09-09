import * as vscode from "vscode";
import * as path from "path";
import { AbstractManager } from "./abstractManager";

export interface IFileTextItem {
    value: string;
    param?: string;
    addCount: number;
    updateCount: number;
    language?: string;
    createdAtString: string;
    updatedAtString: string;
    createdLocation?: vscode.Location;
}

export interface IFileTextChange {
    value: string;
    param?: string;
    language?: string;
    createdAtString: string;
    createdLocation?: vscode.Location;
}

export function createTextChange(editor: vscode.TextEditor | undefined, value: string): IFileTextChange {
    const change: IFileTextChange = {
        value: value,
        createdAtString: new Date().toLocaleString(),
    };

    let doc = editor?.document
    if (editor == undefined || doc == undefined) {
        return change
    }

    change.language = doc.languageId;
    change.createdLocation = {
        range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
        uri: doc.uri,
    };

    if (vscode.window.state.focused) {
        if (editor.selection) {
            const selection = editor.selection;
            change.createdLocation.range = new vscode.Range(selection.start, selection.end);
        }
    }

    return change
}

// 先按文件名排序；再按所在位置排序
export function fileTextLocationCompare(a: IFileTextItem, b: IFileTextItem) {
    let ta = a.createdLocation?.uri.path;
    let tb = b.createdLocation?.uri.path;

    if (!ta) {
        return -1;
    }

    if (!tb) {
        return 1;
    }

    let ua = path.basename(ta).toLowerCase();
    let ub = path.basename(tb).toLowerCase();

    if (ua > ub) {
        return 1;
    } else if (ua < ub) {
        return -1;
    } else {
        let pa = a.createdLocation?.range.start;
        let pb = b.createdLocation?.range.start;

        if (!pa) {
            return -1;
        }

        if (!pb) {
            return 1;
        }

        return pa.line - pb.line;
    }
}

export async function showFileTextItem(fileTextItem: IFileTextItem, manager: AbstractManager) {
    if (!fileTextItem || !fileTextItem.createdLocation) {
        return;
    }

    const uri = fileTextItem.createdLocation.uri;
    const document = await vscode.workspace.openTextDocument(uri);

    const opts: vscode.TextDocumentShowOptions = {
        viewColumn: vscode.ViewColumn.Active,
    };
    opts.selection = fileTextItem.createdLocation.range;

    const rangeText = document.getText(fileTextItem.createdLocation.range);
    if (rangeText !== fileTextItem.value) { // 当前书签范围对应的文本与书签不匹配，则查找最近匹配的
        // Find current position of value
        const indexes: number[] = [];
        const text = document.getText();
        let lastIndex = text.indexOf(fileTextItem.value); // 找到第一个匹配的索引

        // 查找文档中所有匹配的索引
        while (lastIndex >= 0) {
            indexes.push(lastIndex);
            // 查找bookmark所在位置
            lastIndex = text.indexOf(fileTextItem.value, lastIndex + 1);
        }

        if (indexes.length >= 0) { // 找到了
            const offset = document.offsetAt(fileTextItem.createdLocation.range.start);

            // 根据离书签原始位置的距离，排序
            indexes.sort((a, b) => Math.abs(a - offset) - Math.abs(b - offset));

            const index = indexes[0]; // 取最近的一个位置
            if (index >= 0) {
                const range = new vscode.Range(
                    document.positionAt(index),
                    document.positionAt(index + fileTextItem.value.length)
                );
                opts.selection = range;

                // 更新书签位置范围
                if (fileTextItem.createdLocation) {
                    fileTextItem.createdLocation.range = range;
                }
            }
        }
    }

    manager.updateFileTextByItem(fileTextItem);

    // 光标移到单词的开头
    opts.selection = new vscode.Range(
        opts.selection.start,
        opts.selection.start,
    )
    vscode.window.showTextDocument(document, opts);
}
