import * as vscode from "vscode";
import * as path from "path";

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
export function getWordAtCursor(editor: vscode.TextEditor):string {
    if (!editor.selection.isEmpty) {
        return "";
    }
    var cursorWordRange = editor.document.getWordRangeAtPosition(editor.selection.active);
    if (!cursorWordRange) {
        return "";
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

// var getStackTrace = function () {
//     let obj: Object = {};
//     Error.captureStackTrace(obj, getStackTrace);
//     return obj.stack;
// };
// var log = console.log;
// console.log = function () {
//     var stack = getStackTrace() || ""
//     var matchResult = stack.match(/\(.*?\)/g) || []
//     var line = matchResult[1] || ""
//     for (var i in arguments) {
//         if (typeof arguments[i] == 'object') {
//             arguments[i] = JSON.stringify(arguments[i])
//         }
//         arguments[i] += '----' + line.replace("(", "").replace(")", "")
//     }
//     log.apply(console, arguments)
// };

/*
const STACK_LINE_REGEX = /(\d+):(\d+)\)?$/;

export function lineLogger(...log: any) {
    let err: Error;

    try {
        throw new Error();
    } catch (error:any) {
        err = error;
    }

    try {
        if (err.stack == undefined) {
            return
        }
        const stacks = err.stack.split('\\n');
        const line = STACK_LINE_REGEX.exec(stacks[2]);

        console.log(`[${line}]`, ...log);
    } catch (err) {
        console.log( ...log);
    }
}

// lineLogger.call(console.log, 'foobar');
// lineLogger.call(console.error, 42);

export function getCallerFileNameAndLine(){
    function getException():Error {
        try {
            throw Error('');
        } catch (err:any) {
            return err;
        }
    }

    const err = getException();

    let stack = err.stack;
    if (stack == undefined) {
        stack = "";
    }
    const stackArr = stack.split('\n');
    let callerLogIndex = 0;
    for (let i = 0; i < stackArr.length; i++) {
        if (stackArr[i].indexOf('Map.Logger') > 0 && i + 1 < stackArr.length) {
            callerLogIndex = i + 1;
            break;
        }
    }

    if (callerLogIndex !== 0) {
        const callerStackLine = stackArr[callerLogIndex];
        return `[${callerStackLine.substring(callerStackLine.lastIndexOf(path.sep) + 1, callerStackLine.lastIndexOf(':'))}]`;
    } else {
        return '[-]';
    }
}
*/