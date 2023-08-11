import * as vscode from "vscode";
import * as path from "path";

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

export function createChange(editor: vscode.TextEditor | undefined, value: string): IFileTextChange {
    const change: IFileTextChange = {
        value: value,
        createdAtString: new Date().toLocaleString(),
    };

    let doc = editor?.document
    if (editor == undefined || doc == undefined) {
        return change
    }

    if (vscode.window.state.focused) {
        change.language = doc.languageId;

        if (editor.selection) {
            const selection = editor.selection;
            change.createdLocation = {
                range: new vscode.Range(selection.start, selection.end),
                uri: editor.document.uri,
            };
        }
    }

    return change
}

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