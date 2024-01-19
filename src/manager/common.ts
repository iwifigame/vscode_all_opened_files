import * as path from 'path';
import * as vscode from 'vscode';
import { DESCRIPTION_CONNECTOR_SYMBOL, EXTRA_PARAM_NOT_FOUND } from '../global';
import { AbstractManager } from './abstractManager';

export interface IFileTextItem {
    value: string; // 内容
    param?: string; // 参数
    extraParam?: string; // 额外参数
    addCount: number; // 添加次数
    updateCount: number; // 更新次数
    language?: string; // 语言
    createdAtString: string; // 创建时间
    updatedAtString: string; // 更新时间
    createdLocation?: vscode.Location; // 路径
}

export interface IFileTextChange {
    value: string;
    param?: string;
    language?: string;
    createdAtString: string;
    createdLocation?: vscode.Location;
}

export function createTextChange(
    editor: vscode.TextEditor | undefined,
    value: string,
): IFileTextChange {
    const change: IFileTextChange = {
        value: value,
        createdAtString: new Date().toLocaleString(),
    };

    let doc = editor?.document;
    if (editor == undefined || doc == undefined) {
        return change;
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

    return change;
}

export function getFileTextDescription(fileText: IFileTextItem): string {
    const location = fileText.createdLocation;
    if (!location) {
        return '';
    }
    const lineNumber = location.range.start.line + 1;
    const description =
        path.basename(location.uri.path) +
        ':' +
        lineNumber +
        DESCRIPTION_CONNECTOR_SYMBOL +
        fileText.updateCount;
    return description;
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

    let ua = ta;
    let ub = tb;

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

// 在文件中显示指定项目。如果不匹配，则根据内容查找并更新到最适合的range
export async function showFileTextItem(
    fileTextItem: IFileTextItem | undefined,
    manager: AbstractManager,
) {
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
    if (rangeText !== fileTextItem.value) {
        updateFileTextItemRange(document, fileTextItem);
        opts.selection = fileTextItem.createdLocation.range;
    } else {
        fileTextItem.extraParam = undefined;
    }

    manager.updateFileTextByItem(fileTextItem);

    // 光标移到单词的开头
    if (opts.selection) {
        opts.selection = new vscode.Range(opts.selection.start, opts.selection.start);
    }
    vscode.window.showTextDocument(document, opts);
}

// 当前range可能与内容不匹配，则根据内容查找并更新到最适合的range
export function updateFileTextItemRange(
    document: vscode.TextDocument,
    fileTextItem: IFileTextItem,
) {
    if (!fileTextItem.createdLocation || !fileTextItem.value) {
        // 空字符，不做处理。否则插件会奔溃
        return;
    }

    const text = document.getText(); // 所有文档内容
    const targetText = fileTextItem.value;

    const targetOffset = document.offsetAt(fileTextItem.createdLocation.range.start);
    let lastIndex = text.lastIndexOf(targetText, targetOffset - 1);
    let nextIndex = text.indexOf(targetText, targetOffset);
    let curIndex = nextIndex;
    if (Math.abs(lastIndex - targetOffset) < Math.abs(nextIndex - targetOffset)) {
        curIndex = lastIndex;
    }

    if (curIndex < 0) {
        // 没有找到
        fileTextItem.extraParam = EXTRA_PARAM_NOT_FOUND;
    } else {
        fileTextItem.extraParam = undefined;

        const range = new vscode.Range(
            document.positionAt(curIndex),
            document.positionAt(curIndex + targetText.length),
        );
        // 更新书签位置范围
        fileTextItem.createdLocation.range = range;
    }
}
