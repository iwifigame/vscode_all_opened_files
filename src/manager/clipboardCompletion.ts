import * as vscode from 'vscode';
import { commandList } from '../global';
import { ClipboardManager } from './clipboardManager';
import { leftPad } from '../util/util';

export class ClipboardCompletion implements vscode.CompletionItemProvider {
    constructor(protected manager: ClipboardManager) {}

    public provideCompletionItems(
        document: vscode.TextDocument,
        _position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext,
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const config = vscode.workspace.getConfiguration('ClipManager', document.uri);

        const enabled = config.get<boolean>('snippet.enabled', true);

        if (!enabled) {
            return null;
        }

        const prefix = config.get<string>('snippet.prefix', 'clip');
        const maxSnippets = config.get<number>('snippet.max', 10);

        // 得到要自动提示的剪贴板项目列表
        const clips =
            maxSnippets > 0
                ? this.manager.fileTexts.slice(0, maxSnippets) // 返回前面的clips
                : this.manager.fileTexts;

        const maxLength = `${clips.length}`.length;

        // 转成vscode完成项目
        const completions: vscode.CompletionItem[] = clips.map((clip, index) => {
            // Add left zero pad from max number of clips
            const indexNumber = leftPad(index + 1, maxLength, '0');

            const c: vscode.CompletionItem = {
                label: `${prefix}${indexNumber}`,
                // detail: `Clipboard ${indexNumber}`,
                detail: clip.value,
                insertText: clip.value,
                kind: vscode.CompletionItemKind.Text,
                filterText: `${prefix}${indexNumber} ${clip.value}`,
            };

            // Highlight the syntax of clip
            c.documentation = new vscode.MarkdownString();
            c.documentation.appendCodeblock(clip.value, clip.language);

            if (clip.updatedAtString) {
                c.detail += ' - ' + clip.updatedAtString;
            }

            c.command = {
                command: commandList.setClipboardValue,
                title: 'Paste',
                tooltip: 'Paste',
                arguments: [clip.value],
            };

            return c;
        });

        return completions;
    }
}
