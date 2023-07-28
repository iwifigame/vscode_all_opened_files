import * as vscode from "vscode";

export interface IFileTextItem {
    value: string;
    param?: string;
    // lastUse?: number;
    addCount: number;
    updateCount: number;
    language?: string;
    createdAt: number; // 创建时间
    createdLocation?: vscode.Location;
}

export interface IFileTextChange {
    value: string;
    param?: string;
    language?: string;
    createdAt: number;
    createdLocation?: vscode.Location;

    isJustChangeLocation?: boolean;
    ignoreAddCount?: boolean;
}

export function createChange(editor: vscode.TextEditor | undefined, value: string): IFileTextChange {
    const change: IFileTextChange = {
        value: value,
        createdAt: Date.now(),
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
