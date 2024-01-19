import * as vscode from 'vscode';
import { log } from '../util/logger';

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
        const text = document.getText(); // 所有文档内容

        let funcName = this.languageFuncNames.get(document.languageId);
        if (!funcName) {
            funcName = '\\bfunction\\b';
        }

        let cursorPos = editor.selection.active;

        let curIndex: number = document.offsetAt(cursorPos);

        let index: number = -1;
        const reg = new RegExp(funcName);
        if (isNext) {
            for (let line = cursorPos.line + 1; line < document.lineCount; line++) {
                let i = this.getDocumentLineMatchIndex(document, line, reg);
                if (i != undefined) {
                    index = i;
                    break;
                }
            }
        } else {
            for (let line = cursorPos.line - 1; line >= 0; line--) {
                let i = this.getDocumentLineMatchIndex(document, line, reg);
                if (i != undefined) {
                    index = i;
                    break;
                }
            }
        }
        if (index >= 0) {
            const range = new vscode.Range(
                document.positionAt(index),
                document.positionAt(index + funcName.length),
            );

            const opts: vscode.TextDocumentShowOptions = {
                viewColumn: vscode.ViewColumn.Active,
            };
            opts.selection = range;
            // 光标移到单词的开头
            if (opts.selection) {
                opts.selection = new vscode.Range(opts.selection.start, opts.selection.start);
            }
            vscode.window.showTextDocument(document, opts);
        }
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
