import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getStoreFolder } from "../global";
import { IFileTextItem, IFileTextChange } from "./common";

export abstract class AbstractManager implements vscode.Disposable {
    protected _disposable: vscode.Disposable[] = [];

    protected _fileTexts: IFileTextItem[] = [];
    protected lastUpdate: number = 0;
    private _onDidFileTextListChange = new vscode.EventEmitter<void>();
    public readonly onDidChangeFileTextList = this._onDidFileTextListChange.event;

    constructor(protected context: vscode.ExtensionContext) {
        this.loadFileTexts();

        vscode.window.onDidChangeWindowState(
            state => {
                if (state.focused) {
                    this.checkFileTextsUpdate();
                }
            },
            this,
            this._disposable
        );

        vscode.workspace.onDidChangeConfiguration(
            e => e.affectsConfiguration(this.getConfigName()) && this.savefileTexts()
        );

        this.init();
    }

    protected init() {
    }

    public abstract getConfigName(): string;

    public get fileTexts() {
        return this._fileTexts;
    }

    protected preSave(): void { };

    protected get avoidDuplicates(): boolean {
        const config = vscode.workspace.getConfiguration(this.getConfigName());
        return config.get("avoidDuplicates", true);
    }

    protected get maxfileTexts(): number {
        const config = vscode.workspace.getConfiguration(this.getConfigName());
        return config.get("maxfileTexts", 100);
    }

    protected get moveToTop(): boolean {
        const config = vscode.workspace.getConfiguration(this.getConfigName());
        return config.get("moveToTop", true);
    }

    protected isFileTextItemEqual(a: IFileTextItem, b: IFileTextItem): boolean {
        return a.value === b.value;
    }

    public createChange(editor: vscode.TextEditor | undefined, value: string): IFileTextChange {
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

    public addFileText(change: IFileTextChange) {
        this.checkFileTextsUpdate();

        const config = vscode.workspace.getConfiguration(this.getConfigName());

        let newItem: IFileTextItem = {
            value: change.value,
            param: change.param,
            addCount: 1,
            updateCount: 0,
            language: change.language,
            createdAt: change.createdAt,
            createdLocation: change.createdLocation,
        };

        if (this.avoidDuplicates) {
            const index = this._fileTexts.findIndex(c => this.isFileTextItemEqual(c, newItem));

            // Remove same fileTexts and move recent to top
            if (index >= 0) {
                let item = this._fileTexts[index];
                item.value = change.value
                item.param = change.param
                if (change.createdLocation) {
                    item.createdLocation = change.createdLocation
                }

                if (!change.isJustChangeLocation) {
                    if (!change.ignoreAddCount) {
                        item.addCount++;
                    }
                    if (this.moveToTop) {
                        // this._fileTexts = this._fileTexts.filter(c => c.value !== change.value);
                        const deleted = this.fileTexts.splice(index, 1); // 删除index处一个元素，即将当前元素删除
                        this._fileTexts.unshift(...deleted); // 重新插入
                    }
                }
            } else {
                this._fileTexts.unshift(newItem);
            }
        } else {
            this._fileTexts.unshift(newItem);
        }

        // Max fileTexts to store
        if (this.maxfileTexts > 0) {
            this._fileTexts = this._fileTexts.slice(0, this.maxfileTexts);
        }

        this._onDidFileTextListChange.fire();

        this.savefileTexts();
    }

    public async updateFileText(value: string) {
        this.checkFileTextsUpdate();

        const config = vscode.workspace.getConfiguration(this.getConfigName());

        const index = this._fileTexts.findIndex(c => c.value === value);

        if (index >= 0) {
            let item = this._fileTexts[index]
            item.updateCount++;

            if (this.moveToTop) { // 移到头部:先删除，再插入
                const deleted = this.fileTexts.splice(index, 1); // 删除index处一个元素，即将当前元素删除
                this._fileTexts.unshift(...deleted); // 重新插入
                this._onDidFileTextListChange.fire();
                this.savefileTexts();
            }
        }
    }

    public getFileText(value: string): IFileTextItem | null {
        const index = this._fileTexts.findIndex(c => c.value === value);
        if (index < 0) {
            return null
        }
        return this._fileTexts[index]
    }

    public getFileTextByParam(value: string): IFileTextItem | null {
        const index = this._fileTexts.findIndex(c => c.param === value);
        if (index < 0) {
            return null
        }
        return this._fileTexts[index]
    }


    public removeFileText(value: string) {
        this.checkFileTextsUpdate();

        const index = this._fileTexts.findIndex(c => c.value === value);
        if (index < 0) {
            return false
        }
        this.fileTexts.splice(index, 1);
        this._onDidFileTextListChange.fire();
        this.savefileTexts();
        return true
    }

    public remove(value: IFileTextItem) {
        this.checkFileTextsUpdate();

        const index = this._fileTexts.findIndex(c => c === value);
        if (index < 0) {
            return false
        }
        this.fileTexts.splice(index, 1);
        this._onDidFileTextListChange.fire();
        this.savefileTexts();
        return true
    }


    public clearAll() {
        this.checkFileTextsUpdate();

        this._fileTexts = [];
        this._onDidFileTextListChange.fire();
        this.savefileTexts();

        return true;
    }

    protected getStoreFile() {
        let folder = getStoreFolder();

        const filePath = path.join(folder, "." + this.getConfigName() + ".json");

        const config = vscode.workspace.getConfiguration(this.getConfigName());
        const saveTo = config.get<string | null | boolean>("saveTo");

        if (typeof saveTo === "string") {
            return saveTo;
        }

        if (saveTo === false) {
            return false;
        }

        return filePath;
    }

    protected jsonReplacer(key: string, value: any) {
        if (key === "createdLocation" && value) {
            value = {
                range: {
                    start: value.range.start,
                    end: value.range.end,
                },
                uri: value.uri.toString(),
            };
        } else if (value instanceof vscode.Uri) {
            value = value.toString();
        }

        return value;
    }

    // 保存文件
    public savefileTexts() {
        this.preSave();

        const file = this.getStoreFile();
        if (!file) {
            return;
        }

        let json = "[]";
        try {
            json = JSON.stringify(
                {
                    version: 2,
                    fileTexts: this._fileTexts,
                },
                this.jsonReplacer,
                2
            );
        } catch (error) {
            console.error(error);
            return;
        }

        try {
            fs.writeFileSync(file, json);
            this.lastUpdate = fs.statSync(file).mtimeMs;
        } catch (error) {
            // switch (error.code) {
            //   case "EPERM":
            //     vscode.window.showErrorMessage(
            //       `Not permitted to save clipboards on "${file}"`
            //     );
            //     break;
            //   case "EISDIR":
            //     vscode.window.showErrorMessage(
            //       `Failed to save clipboards on "${file}", because the path is a directory`
            //     );
            //     break;
            //   default:
            //     console.error(error);
            // }
        }
    }

    // 检查保存file texts的文件是否有更新，有则说明有其它程序保存了新的内容。则加载
    private checkFileTextsUpdate() {
        const file = this.getStoreFile();

        if (!file) {
            return;
        }

        if (!fs.existsSync(file)) {
            return;
        }

        // 检查修改时间。如果文件更新，则重新加载
        const stat = fs.statSync(file);
        if (this.lastUpdate < stat.mtimeMs) {
            this.lastUpdate = stat.mtimeMs;
            this.loadFileTexts();
        }
    }

    // 从文件中，加载file text
    public loadFileTexts() {
        console.info("loadFileTexts start", this.getConfigName());

        let json: string = "";

        const file = this.getStoreFile();
        if (file && fs.existsSync(file)) {
            try {
                json = fs.readFileSync(file).toString();
                this.lastUpdate = fs.statSync(file).mtimeMs;
            } catch (error) {
                // ignore
            }
        }

        if (!json || json.length == 0) {
            return;
        }

        let stored: any = {};
        try {
            stored = JSON.parse(json);
        } catch (error) {
            console.error(error);
            return;
        }

        if (!stored.version || !stored.fileTexts) {
            return;
        }

        let fileTexts = stored.fileTexts as any[];

        // 老版本数据转换
        if (stored.version === 1) {
            fileTexts = fileTexts.map(c => {
                c.createdAt = c.timestamp;
                c.copyCount = 1;
                c.useCount = 0;
                c.createdLocation = c.location;
                return c;
            });
            stored.version = 2;
        }

        this._fileTexts = fileTexts.map(c => {
            const fileText: IFileTextItem = {
                value: c.value,
                param: c.param,
                createdAt: c.createdAt,
                addCount: c.addCount,
                updateCount: c.updateCount,
                language: c.language,
            };
            // 数据修复
            if (!fileText.addCount) {
                fileText.addCount = 1;
            }
            if (!fileText.updateCount) {
                fileText.updateCount = 0;
            }

            if (c.createdLocation) {
                const uri = vscode.Uri.parse(c.createdLocation.uri);
                const range = new vscode.Range(
                    c.createdLocation.range.start.line,
                    c.createdLocation.range.start.character,
                    c.createdLocation.range.end.line,
                    c.createdLocation.range.end.character
                );
                fileText.createdLocation = new vscode.Location(uri, range);
            }

            return fileText;
        });

        this._onDidFileTextListChange.fire();
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
