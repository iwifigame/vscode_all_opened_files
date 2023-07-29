import * as vscode from "vscode";

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
