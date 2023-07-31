import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { GIT_EXT } from "../global";

export interface IDisposable {
    dispose(): void;
}

export function toDisposable(dispose: () => void): IDisposable {
    return { dispose };
}

export function leftPad(
    value: string | number,
    size: number,
    char: string = " "
) {
    const chars = char.repeat(size);

    const paddedNumber = `${chars}${value}`.substr(-chars.length);

    return paddedNumber;
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 选择光标所在的单词
export function selectWordAtCursor(editor: vscode.TextEditor) {
    if (!editor.selection.isEmpty) {
        return true;
    }
    var cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.active);
    if (!cursorWordRange) {
        return false;
    }
    var newSe = new vscode.Selection(cursorWordRange.start.line, cursorWordRange.start.character, cursorWordRange.end.line, cursorWordRange.end.character);
    editor.selection = newSe;
    return true;
}

// 得到光标所在的单词
export function getWordAtCursor(editor: vscode.TextEditor): string {
    if (!editor.selection.isEmpty) {
        return "";
    }
    var cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.active);
    if (!cursorWordRange) {
        return "";
    }
    return editor.document.getText(cursorWordRange)
}

export function pathEqual(a: string | undefined, b: string | undefined): boolean {
    if (!a || !b) {
        return false
    }
    return a === b || simplePath(a) === simplePath(b)
}

function simplePath(path: string): string {
    const replace: [RegExp, string][] = [
        // [/\\/g, '/'],
        // [/(\w):/, '/$1'],
        // [/(\w+)\/\.\.\/?/g, ''],
        // [/^\.\//, ''],
        // [/\/\.\//, '/'],
        // [/\/\.$/, ''],
        // [/\/$/, '']
        [/\\/g, ''],
        [/\//g, ''],
        [/\./g, ''],
    ]

    replace.forEach(array => {
        while (array[0].test(path)) {
            path = path.replace(array[0], array[1])
        }
    })

    return path
}

export function isOpenPathlegal(filePath: string): boolean {
    let extname = path.extname(filePath)
    // 打开文件时，vscode会打开.git同名的后缀文件
    if (GIT_EXT == extname) {
        return false;
    }

    // 打开文件时，vscode会打开extension等其它文件
    if (!fs.existsSync(filePath)) {
        return false;
    }

    return true
}
