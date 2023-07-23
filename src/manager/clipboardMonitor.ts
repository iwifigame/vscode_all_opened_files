import * as vscode from "vscode";
import { BaseClipboard } from "./clipboard";
import { toDisposable } from "../util/util";
import { IFileTextChange } from "./common";

// 监视器：每500ms监视剪贴板内容的改变
export class ClipboardMonitor implements vscode.Disposable {
    protected _disposables: vscode.Disposable[] = [];

    protected _previousText: string = "";

    protected _windowFocused: boolean = true;

    public onlyWindowFocused: boolean = true;

    private _onDidChangeText = new vscode.EventEmitter<IFileTextChange>(); // 事件发射器
    public readonly onDidChangeText = this._onDidChangeText.event; // 事件发射器的事件，可添加回调处理函数

    protected _timer: NodeJS.Timer | undefined;

    public maxClipboardSize: number = 1000000;

    protected _checkInterval: number = 500;
    get checkInterval() {
        return this._checkInterval;
    }
    set checkInterval(timeout: number) {
        this._checkInterval = timeout;
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = undefined;
        }
        // Minimum timeout to avoid cpu high usage
        if (timeout >= 100) {
            this._timer = setInterval(() => this.checkChangeText(), timeout);
        }
    }

    constructor(readonly clipboard: BaseClipboard) {
        // Update current clipboard to check changes after init
        this.readText().then(value => {
            this._previousText = value;

            // Initialize the checkInterval
            this.checkInterval = this._checkInterval;

            return value;
        });

        // Updates the previous value if you change it manually
        this._disposables.push(
            this.clipboard.onDidWriteText(value => {
                this._previousText = value;
            })
        );

        this._disposables.push(
            toDisposable(() => {
                if (this._timer) {
                    clearInterval(this._timer);
                }
            })
        );

        this._windowFocused = vscode.window.state.focused;
        // Update current clip when window if focused again
        vscode.window.onDidChangeWindowState(
            this.onDidChangeWindowState,
            this,
            this._disposables
        );
    }

    // 从剪贴板中读内容
    protected async readText(): Promise<string> {
        const text = await this.clipboard.readText();
        if (text.length > this.maxClipboardSize) {
            return "";
        }
        return text;
    }

    protected async onDidChangeWindowState(state: vscode.WindowState) {
        // Prevent detect change from external copy
        if (this.onlyWindowFocused && state.focused) {
            this._previousText = await this.readText();
        }

        this._windowFocused = state.focused;
    }

    public async checkChangeText() {
        // console.log('checkchangetext')

        // Don't check the clipboard when windows is not focused
        if (this.onlyWindowFocused && !this._windowFocused) {
            return;
        }

        // 对比剪贴板内容是否变动了
        const newText = await this.readText();
        if (newText === this._previousText) {
            return;
        }

        // 创建剪贴板内容修改对象
        const change: IFileTextChange = {
            value: newText,
            createdAt: Date.now(),
        };

        const editor = vscode.window.activeTextEditor;

        if (this._windowFocused && editor && editor.document) {
            // Set current language of copied clip
            change.language = editor.document.languageId;

            // Try get position of clip
            if (editor.selection) {
                const selection = editor.selection;
                change.createdLocation = {
                    range: new vscode.Range(selection.start, selection.end),
                    uri: editor.document.uri,
                };
            }
        }

        this._onDidChangeText.fire(change); // 派发修改事件
        this._previousText = newText;
    }

    public dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}
