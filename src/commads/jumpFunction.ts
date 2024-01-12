import * as vscode from 'vscode';

export class JumpFunctionCommand implements vscode.Disposable {
    protected _disposable: vscode.Disposable[] = [];

    protected async execute(isNext: boolean) {
        const editor = vscode.window.activeTextEditor;
        if (editor == undefined) {
            return;
        }
        let document = editor.document;
        const text = document.getText(); // 所有文档内容

        // todolyj 走配置
        const FUNC_NAME_MAP = new Map();
        FUNC_NAME_MAP.set('go', 'func');
        FUNC_NAME_MAP.set('lua', 'function');
        FUNC_NAME_MAP.set('javascript', 'function');
        FUNC_NAME_MAP.set('typescript', 'function');

        let funcName = FUNC_NAME_MAP.get(document.languageId);
        if (!funcName) {
            funcName = 'function';
        }

        let cursorPos = editor.selection.active;
        let curIndex: number = document.offsetAt(cursorPos);

        let index: number = 0;
        if (isNext) {
            index = text.indexOf(funcName, curIndex + 1); // 找到第一个匹配的索引
        } else {
            index = text.lastIndexOf(funcName, curIndex - 1); // 找到第一个匹配的索引
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
}
