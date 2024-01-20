import * as vscode from 'vscode';

export class JumpFunctionCommand implements vscode.Disposable {
    protected _disposable: vscode.Disposable[] = [];
    private languageFuncNames: any = {};

    constructor() {
        this.setupConfigs();
    }

    private setupConfigs() {
        this.languageFuncNames = vscode.workspace.getConfiguration('FunctionJump');
    }

    protected async execute(isNext: boolean) {
        const editor = vscode.window.activeTextEditor;
        if (editor == undefined) {
            return;
        }
        let document = editor.document;

        let funcNameRegExp = this.languageFuncNames.get(document.languageId);
        if (!funcNameRegExp) {
            funcNameRegExp = '\\bfunction\\b';
        }

        let marchedIndex: number = -1;
        const lineCount = document.lineCount;
        let cursorPos = editor.selection.active;
        const reg = new RegExp(funcNameRegExp);
        let line = cursorPos.line;
        let isLoop = false;
        for (let i = 0; i < lineCount; i++) {
            if (isNext) {
                line++;
            } else {
                line--;
            }
            if (isLoop) {
                if (line < 0) {
                    line = lineCount - 1;
                } else if (line > lineCount - 1) {
                    line = 0;
                }
            } else {
                if (line < 0 || line > lineCount - 1) {
                    break;
                }
            }
            let t = this.getDocumentLineMatchIndex(document, line, reg);
            if (t != undefined) {
                marchedIndex = t;
                break;
            }
        }

        if (marchedIndex < 0) {
            // vscode.window.showInformationMessage('No function found');
            return;
        }

        const pos = document.positionAt(marchedIndex);
        const opts: vscode.TextDocumentShowOptions = {
            viewColumn: vscode.ViewColumn.Active,
            selection: new vscode.Range(pos, pos),
        };
        vscode.window.showTextDocument(document, opts);
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }

    private getFirstNonWhitespaceCharIndex(str: String): number | undefined {
        const match = str.match(/\S/);
        if (match) {
            return match.index;
        }
        return;
    }

    private getDocumentLineMatchIndex(
        document: vscode.TextDocument,
        line: number,
        reg: RegExp,
    ): number | undefined {
        let lineText = document.lineAt(line).text;
        let pos = this.getTextMatchPos(lineText, reg);
        if (pos != undefined) {
            let p = new vscode.Position(line, pos);
            let index = document.offsetAt(p);
            return index;
        }
    }

    private getTextMatchPos(text: String, reg: RegExp): number | undefined {
        if (!text) {
            return;
        }

        let m = text.match(reg);
        if (m && m.length > 0) {
            let pos = this.getFirstNonWhitespaceCharIndex(m[0]);
            return pos;
        }
    }
}
