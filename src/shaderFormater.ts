import * as vscode from 'vscode';
import { INFO } from './util/logger';

enum MacroIndentation {
    Dont = 'dont',
    Indent = 'indent',
    Normal = 'normal',
}

export class UnityShaderFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
    isComment(line: string) {
        return line.startsWith('//');
    }

    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken,
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        INFO(
            'ShaderFormattingEditProvider.provideDocumentFormattingEdits: start format...',
            document.fileName,
        );

        const MACRO_BEGIN = /^\s*#if/;
        const MACRO_END = /^\s*#endif/;
        const MACRO_MIDDLE = /^\s*(#else|#elif)/;
        const BRACKET_LEFT = /\{(?!})|\bCBUFFER_START\b/;
        const BRACKET_RIGHT = /(?<!{)\}|\bCBUFFER_END\b/;
        const EMPTY_LINE = /^\s*$/;

        let indentUtil: Indent = new Indent();
        indentUtil.initIndent(options.insertSpaces, options.tabSize);

        // let config = vscode.workspace.getConfiguration('shaderlabformatter.indentation');
        // let macroIndentation = config.get<MacroIndentation>(
        //     'conditionMacro',
        //     MacroIndentation.Indent,
        // );
        let macroIndentation: string = MacroIndentation.Indent;

        const result: vscode.TextEdit[] = [];
        const lineCount = document.lineCount;
        var indent = 0;
        for (var lineIdx = 0; lineIdx < lineCount; lineIdx++) {
            var line = document.lineAt(lineIdx);
            if (line.range.isEmpty) {
                continue;
            }

            const lineText = line.text;

            const bracketLeft = BRACKET_LEFT.test(lineText);
            const bracketRight = BRACKET_RIGHT.test(lineText);
            if (!bracketLeft && bracketRight) {
                indent--;
            }

            let nowIndent = indent;
            const macroBegin = MACRO_BEGIN.test(lineText);
            const macroEnd = MACRO_END.test(lineText);
            const macroMiddle = MACRO_MIDDLE.test(lineText);
            if (macroEnd || macroMiddle || macroBegin) {
                switch (macroIndentation) {
                    case MacroIndentation.Dont:
                        nowIndent = 0;
                        break;
                    case MacroIndentation.Indent:
                        if (macroEnd) {
                            indent--;
                            nowIndent = indent;
                        } else if (macroMiddle) {
                            nowIndent = indent - 1;
                        }
                        break;
                    case MacroIndentation.Normal:
                        // do nothing
                        break;
                }
            }

            var firstCharIdx = line.firstNonWhitespaceCharacterIndex; // todolyj 第一个非空白字符的索引
            if (!indentUtil.isIndent(lineText, firstCharIdx, nowIndent)) {
                // 不全是缩进字符，说明缩进出错。重新缩进
                result.push(
                    vscode.TextEdit.delete(new vscode.Range(lineIdx, 0, lineIdx, firstCharIdx)),
                );
                result.push(
                    vscode.TextEdit.insert(line.range.start, indentUtil.getIndent(nowIndent)),
                );
            }
            // delete empty line
            if (EMPTY_LINE.test(lineText)) {
                result.push(vscode.TextEdit.delete(line.range));
            }

            if (bracketLeft && !bracketRight) {
                indent++;
            }
            if (macroBegin && macroIndentation === MacroIndentation.Indent) {
                indent++;
            }
        }
        return result;
    }
}

export class Indent {
    private indentCode: number = 32;
    private indentStr: string = '';
    private isIndentSpaces: boolean = false;
    private readonly indentMap: Map<number, string> = new Map<number, string>();

    initIndent(insertSpaces: boolean, tabSize: number): void {
        this.isIndentSpaces = insertSpaces;
        this.indentCode = (insertSpaces ? ' ' : '\t').charCodeAt(0);
        this.indentStr = insertSpaces ? ' '.repeat(tabSize) : '\t';
        this.indentMap.clear();
        for (let i = 1; i <= 10; i++) {
            this.indentMap.set(i, this.indentStr.repeat(i));
        }
    }
    getIndent(indent: number): string {
        if (indent <= 0) {
            return '';
        }
        if (this.indentMap.has(indent)) {
            return this.indentMap.get(indent) || '';
        }
        return this.indentStr.repeat(indent);
    }

    // 指定字符串的前len个字符，是不是全是缩进字符
    isIndent(s: string, len: number, indent: number) {
        let count = this.indentStr === '\t' ? indent : indent * this.indentStr.length;
        if (len !== count) {
            return false;
        }
        for (var i = 0; i < len; i++) {
            if (s.charCodeAt(i) !== this.indentCode) {
                return false;
            }
        }
        return true;
    }
}
