import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getStoreFolder } from '../global';
import { IFileTextChange, IFileTextItem } from './common';

const CUR_VERSION = 3;
const SAVE_FILE_TIME_GAP = 1000 * 10; // 每10s保存一次文件

export abstract class AbstractManager implements vscode.Disposable {
    protected _disposable: vscode.Disposable[] = [];

    protected _fileTexts: IFileTextItem[] = [];
    protected lastUpdate: number = 0;
    private _onDidFileTextListChange = new vscode.EventEmitter<IFileTextItem>();
    public readonly onDidChangeFileTextList = this._onDidFileTextListChange.event;

    private _timer: NodeJS.Timer | undefined;
    private isFileDirty: boolean = false;

    constructor() {
        this.loadFileTexts();

        vscode.window.onDidChangeWindowState(
            (state) => {
                if (state.focused) {
                    this.checkFileTextsUpdate();
                }
            },
            this,
            this._disposable,
        );

        vscode.workspace.onDidChangeConfiguration(
            (e) => e.affectsConfiguration(this.getConfigName()) && this.saveFileTexts(),
        );

        this._timer = setInterval(() => this.saveFileLoop(), SAVE_FILE_TIME_GAP);

        this.init();
    }

    protected init() { }

    protected abstract getConfigName(): string;

    public get fileTexts() {
        return this._fileTexts;
    }

    protected get avoidDuplicates(): boolean {
        const config = vscode.workspace.getConfiguration(this.getConfigName());
        return config.get('avoidDuplicates', true);
    }

    protected get maxfileTexts(): number {
        const config = vscode.workspace.getConfiguration(this.getConfigName());
        return config.get('maxfileTexts', 100);
    }

    protected get moveToTop(): boolean {
        const config = vscode.workspace.getConfiguration(this.getConfigName());
        return config.get('moveToTop', true);
    }

    protected isFileTextItemEqual(a: IFileTextItem, b: IFileTextItem): boolean {
        return a.value === b.value;
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
            createdAtString: change.createdAtString,
            updatedAtString: change.createdAtString,
            createdLocation: change.createdLocation,
        };

        if (this.avoidDuplicates) {
            const index = this._fileTexts.findIndex((c) => this.isFileTextItemEqual(c, newItem));

            if (index >= 0) {
                let item = this._fileTexts[index];
                item.value = change.value;
                item.param = change.param;
                if (change.createdLocation) {
                    item.createdLocation = change.createdLocation;
                }

                item.addCount++;

                this.hdlMoveIndexToTop(index);
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

        this.fireAndSave(newItem);
    }

    public async updateFileText(value: string) {
        let item = this.getFileText(value);
        if (item) {
            this.updateFileTextByItem(item);
        }
    }

    public async updateFileTextByItem(item: IFileTextItem) {
        this.checkFileTextsUpdate();

        const index = this._fileTexts.findIndex((c) => this.isFileTextItemEqual(c, item));
        if (index < 0) {
            return;
        }

        item = this._fileTexts[index];
        item.updateCount++;
        item.updatedAtString = new Date().toLocaleString();

        this.hdlMoveIndexToTop(index);
        this.fireAndSave(item);
    }

    private hdlMoveIndexToTop(index: number) {
        if (this.moveToTop) {
            const deleted = this.fileTexts.splice(index, 1); // 删除index处一个元素，即将当前元素删除
            this._fileTexts.unshift(...deleted); // 重新插入
        }
    }

    public getFileText(value: string): IFileTextItem | null {
        const index = this._fileTexts.findIndex((c) => c.value === value);
        if (index < 0) {
            return null;
        }
        return this._fileTexts[index];
    }

    public removeFileText(value: string) {
        this.checkFileTextsUpdate();
        let t = this.getFileText(value);
        if (t == null) {
            return false;
        }
        return this.remove(t);
    }

    public remove(value: IFileTextItem) {
        this.checkFileTextsUpdate();

        const index = this._fileTexts.findIndex((c) => c === value);
        if (index < 0) {
            return false;
        }
        this.fileTexts.splice(index, 1);

        this.fireAndSave(undefined);

        return true;
    }

    public clearAll() {
        this.checkFileTextsUpdate();

        this._fileTexts = [];

        this.fireAndSave(undefined);

        return true;
    }

    private getStoreFile() {
        const folder = getStoreFolder();
        const filePath = path.join(folder, '.' + this.getConfigName() + '.json');

        const config = vscode.workspace.getConfiguration(this.getConfigName());
        const saveTo = config.get<string | null | boolean>('saveTo');
        if (typeof saveTo === 'string') {
            return saveTo;
        }
        if (saveTo === false) {
            return false;
        }

        return filePath;
    }

    protected fireAndSave(item: IFileTextItem | undefined) {
        this.isFileDirty = true;
        this._onDidFileTextListChange.fire(item);
    }

    private saveFileLoop() {
        if (!this.isFileDirty) {
            return;
        }

        // console.info("FileTextsOperate saveFileLoop", this.getConfigName(), this.lastUpdate, Date.now());
        this.isFileDirty = false;
        this.saveFileTexts();
    }

    // 保存文件
    public saveFileTexts() {
        const file = this.getStoreFile();
        if (!file) {
            return;
        }

        let json = '[]';
        try {
            let jsonReplacer = (key: string, value: any) => {
                if (key === 'createdLocation' && value) {
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
            };

            json = JSON.stringify(
                {
                    version: CUR_VERSION,
                    count: this._fileTexts.length,
                    fileTexts: this._fileTexts,
                },
                jsonReplacer,
                2,
            );
        } catch (error) {
            console.error(error);
            return;
        }

        /*
        fs.writeFile(file, json, (error) => {
            if (!error) {
                this.lastUpdate = fs.statSync(file).mtimeMs;
                // console.info("FileTextsOperate savefileTexts", this.getConfigName(), this.lastUpdate);
                return
            }

            switch (error.code) {
                case "EPERM":
                    vscode.window.showErrorMessage(
                        `Not permitted to save file on "${file}"`
                    );
                    break;
                case "EISDIR":
                    vscode.window.showErrorMessage(
                        `Failed to save file on "${file}", because the path is a directory`
                    );
                    break;
                default:
                    console.error(error);
            }
        });
        */

        try {
            fs.writeFileSync(file, json);
            this.lastUpdate = fs.statSync(file).mtimeMs;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save file:"${file}". error:${error}`);
            // switch (error.code) {
            //     case "EPERM":
            //         vscode.window.showErrorMessage(
            //             `Not permitted to save file on "${file}"`
            //         );
            //         break;
            //     case "EISDIR":
            //         vscode.window.showErrorMessage(
            //             `Failed to save file on "${file}", because the path is a directory`
            //         );
            //         break;
            //     default:
            //         console.error(error);
            // }
        }
    }

    // 检查保存file texts的文件是否有更新，有则说明有其它程序保存了新的内容。则加载
    protected checkFileTextsUpdate() {
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
            // console.info("FileTextsOperate checkFileTextsUpdate load file", this.getConfigName(), this.lastUpdate, stat.mtimeMs);
            this.lastUpdate = stat.mtimeMs;
            this.loadFileTexts();
        }
    }

    // 从文件中，加载file text
    private loadFileTexts() {
        // console.info("FileTextsOperate load", this.getConfigName(), this.lastUpdate);

        let json: string = '';

        const file = this.getStoreFile();
        if (file && fs.existsSync(file)) {
            try {
                json = fs.readFileSync(file).toString();
                this.lastUpdate = fs.statSync(file).mtimeMs;
                // console.info("FileTextsOperate load readed", this.getConfigName(), this.lastUpdate);
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
        if (stored.version === CUR_VERSION - 1) {
            fileTexts = fileTexts.map((c) => {
                if (c.createdAt) {
                    let d = new Date(c.createdAt);
                    c.createdAtString = d.toLocaleString();
                }
                return c;
            });
            stored.version = CUR_VERSION;
        }

        this._fileTexts = fileTexts.map((c) => {
            const fileText: IFileTextItem = {
                value: c.value,
                param: c.param,
                createdAtString: c.createdAtString,
                updatedAtString: c.updatedAtString,
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
            if (!fileText.updatedAtString) {
                fileText.updatedAtString = fileText.createdAtString;
            }

            if (c.createdLocation) {
                const uri = vscode.Uri.parse(c.createdLocation.uri);
                const range = new vscode.Range(
                    c.createdLocation.range.start.line,
                    c.createdLocation.range.start.character,
                    c.createdLocation.range.end.line,
                    c.createdLocation.range.end.character,
                );
                fileText.createdLocation = new vscode.Location(uri, range);
            }

            return fileText;
        });

        this._onDidFileTextListChange.fire();
    }

    public dispose() {
        this._disposable.forEach((d) => d.dispose());
    }
}
