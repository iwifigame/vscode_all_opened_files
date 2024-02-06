import * as vscode from 'vscode';

class DecorationImpl {
    private _default!: vscode.TextEditorDecorationType;
    private _markDecorationCache = new Map<string, vscode.TextEditorDecorationType>(); // name <---> 标记
    private _markDecorationToEditorMap = new Map<
        vscode.TextEditorDecorationType,
        vscode.TextEditor
    >(); // 标记 <---> editor

    public setEditorMarkDecoration(
        editor: vscode.TextEditor,
        range: vscode.Range,
        markName: string,
    ) {
        let mark = this.getOrCreateMarkDecoration(markName);
        const oldEditor = this._markDecorationToEditorMap.get(mark);
        if (oldEditor) {
            oldEditor.setDecorations(mark, []);
        }

        editor.setDecorations(mark, [range]);
        this._markDecorationToEditorMap.set(mark, editor);
    }

    // 创建标记
    private _createMarkDecoration(name: string): vscode.TextEditorDecorationType {
        const svg = [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="30px" height="30px">',
            '<style>text { font-family: sans-serif; font-size: 0.8em; }</style>',
            '<path fill="rgb(3,102,214)" d="M23,27l-8-7l-8,7V5c0-1.105,0.895-2,2-2h12c1.105,0,2,0.895,2,2V27z"/>',
            `<text x="50%" y="40%" fill="rgb(200,200,200)" text-anchor="middle" dominant-baseline="middle">${name}</text>`,
            '</svg>',
        ].join(''); // 以name创建svg

        const uri = vscode.Uri.parse(`data:image/svg+xml;utf8,${encodeURI(svg)}`);

        return vscode.window.createTextEditorDecorationType({
            isWholeLine: false,
            gutterIconPath: uri, // 槽图标为上面创建的
            gutterIconSize: 'cover',
        });
    }

    private set default(value: vscode.TextEditorDecorationType) {
        if (this._default) {
            this._default.dispose();
        }
        this._default = value;
    }

    private get default() {
        return this._default;
    }

    // 得到或者创建标记
    private getOrCreateMarkDecoration(markName: string): vscode.TextEditorDecorationType {
        let mark = this.getMarkDecorationCache(markName);
        if (mark) {
            return mark;
        } else {
            mark = this._createMarkDecoration(markName);
            this.setMarkDecorationCache(markName, mark);
            return mark;
        }
    }

    private getMarkDecorationCache(name: string): vscode.TextEditorDecorationType | undefined {
        return this._markDecorationCache.get(name);
    }

    private setMarkDecorationCache(name: string, type: vscode.TextEditorDecorationType) {
        this._markDecorationCache.set(name, type);
    }

    private allMarkDecorations(): IterableIterator<vscode.TextEditorDecorationType> {
        return this._markDecorationCache.values();
    }

    private load() {
        this.default = vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('editorCursor.foreground'),
            borderColor: new vscode.ThemeColor('editorCursor.foreground'),
            dark: {
                color: 'rgb(81,80,82)',
            },
            light: {
                // used for light colored themes
                color: 'rgb(255, 255, 255)',
            },
            borderStyle: 'solid',
            borderWidth: '1px',
        });
    }
}

export const decoration = new DecorationImpl();
