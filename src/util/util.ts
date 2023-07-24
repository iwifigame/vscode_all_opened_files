import * as vscode from "vscode";

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
export function getWordAtCursor(editor: vscode.TextEditor) {
    if (!editor.selection.isEmpty) {
        return;
    }
    var cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.active);
    if (!cursorWordRange) {
        return;
    }
    return editor.document.getText(cursorWordRange)
}

export function pathEqual(actual: string, expected: string): boolean {
    return actual === expected || simplePath(actual) === simplePath(expected)
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