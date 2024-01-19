import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { GIT_EXT, RESOURCES_ROOT } from '../global';

export interface IDisposable {
    dispose(): void;
}

export function toDisposable(dispose: () => void): IDisposable {
    return { dispose };
}

// 左填充。
// @param value: 内容
// @param size: 总宽度
// @param char: 填充字符
// @example: leftPad(8, 3, "0") = "008"
export function leftPad(value: string | number, size: number, char: string = ' ') {
    const chars = char.repeat(size); // 创建填充字符
    const paddedNumber = `${chars}${value}`.slice(-chars.length); // 将填充字符与内容连接，然后去除多余的字符
    return paddedNumber;
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// 选择光标所在的单词
export function selectWordAtCursor(editor: vscode.TextEditor) {
    if (!editor.selection.isEmpty) {
        return true;
    }
    let cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.active);
    if (!cursorWordRange) {
        return false;
    }
    let newSe = new vscode.Selection(
        cursorWordRange.start.line,
        cursorWordRange.start.character,
        cursorWordRange.end.line,
        cursorWordRange.end.character,
    );
    editor.selection = newSe;
    return true;
}

// 得到光标所在的单词
export function getWordAtCursor(editor: vscode.TextEditor): string {
    if (!editor.selection.isEmpty) {
        return '';
    }
    let cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.active);
    if (!cursorWordRange) {
        return '';
    }
    return editor.document.getText(cursorWordRange);
}

export function pathEqual(a: string | undefined, b: string | undefined): boolean {
    if (!a || !b) {
        return false;
    }
    return a === b || simplePath(a) === simplePath(b);
}

// 将路径中“/\.”等全移除，因为win/linux各个平台不同
export function simplePath(path: string): string {
    // const replace: [RegExp, string][] = [
    //     // [/\\/g, '/'],
    //     // [/(\w):/, '/$1'],
    //     // [/(\w+)\/\.\.\/?/g, ''],
    //     // [/^\.\//, ''],
    //     // [/\/\.\//, '/'],
    //     // [/\/\.$/, ''],
    //     // [/\/$/, '']
    //     [/\\/g, ''],
    //     [/\//g, ''],
    //     [/\./g, ''],
    // ];

    // replace.forEach((array) => {
    //     while (array[0].test(path)) {
    //         path = path.replace(array[0], array[1]);
    //     }
    // });

    // 去除路径中的斜杠和冒号，并将所有字符转换为小写
    const normalizedPath = path.replace(/[\/\\:]/g, '').toLowerCase();

    return normalizedPath;
}

export function isOpenPathlegal(filePath: string): boolean {
    let extname = path.extname(filePath);
    // 打开文件时，vscode会打开.git同名的后缀文件
    if (GIT_EXT == extname) {
        return false;
    }

    // 打开文件时，vscode会打开extension等其它文件
    if (!fs.existsSync(filePath)) {
        return false;
    }

    return true;
}

export function createIconPath(iconName: string) {
    return {
        light: path.join(RESOURCES_ROOT, 'light', iconName),
        dark: path.join(RESOURCES_ROOT, 'dark', iconName),
    };
}

export function dateFormat(date: Date, fmt: string) {
    let o = {
        'M+': date.getMonth() + 1, // 月份
        'd+': date.getDate(), // 日
        'h+': date.getHours(), // 小时
        'm+': date.getMinutes(), // 分
        's+': date.getSeconds(), // 秒
        'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
        S: date.getMilliseconds(), // 毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (let k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            let ok = k as keyof typeof o;
            let ov = o[ok].toString();
            fmt = fmt.replace(
                RegExp.$1,
                RegExp.$1.length == 1 ? ov : ('00' + ov).substr(('' + ov).length),
            );
        }
    }
    return fmt;
}

// 多个空白字符，压缩为一个空格
export function compressSpaces(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}
