import * as vscode from 'vscode';
import { decoration } from '../util/decorationUtil';
import { pathEqual } from '../util/util';
import { AbstractManager } from './abstractManager';
import { IFileTextItem, fileTextLocationCompare } from './common';

export class QuickBookmarkManager extends AbstractManager {
    private searchedSet = new Set<IFileTextItem>(); // 已搜索过的项目。用来对t的循环跳转

    protected init() {
        this.onDidChangeFileTextList((item: IFileTextItem) => {
            this.sortBookmarks();
        });

        // 要使用这个方法，不能使用打开事件。
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (!editor) {
                return;
            }

            let doc = editor.document;
            if (doc == undefined) {
                return;
            }

            let filePath = doc.fileName;
            this.fileTexts.forEach((item) => {
                if (!item.param || !item.createdLocation) {
                    return;
                }

                let pa = item.createdLocation.uri.path;
                if (pathEqual(pa, filePath)) {
                    let m = decoration.getOrCreateMarkDecoration(item.param);
                    if (item.createdLocation) {
                        editor.setDecorations(m, [item.createdLocation.range]);
                    }
                }
            });
        });

        /*
        // 给当前文件添加高亮标签
        vscode.workspace.onDidOpenTextDocument((doc: vscode.TextDocument) => {
            const editor = vscode.window.activeTextEditor
            if (!editor) {
                return
            }

            let filePath = doc.fileName;
            if (!isOpenPathlegal(filePath)) {
                return
            }

            this.fileTexts.forEach(
                item => {
                    if (!item.param || !item.createdLocation) {
                        return
                    }

                    let pa = item.createdLocation.uri.path;
                    if (pathEqual(pa, filePath)) {
                        let m = decoration.getOrCreateMarkDecoration(item.param);
                        if (item.createdLocation) {
                            editor.setDecorations(m, [item.createdLocation.range]);
                        }
                    }
                }
            );
        })
        */
    }

    public getConfigName(): string {
        return 'QuickBookmarkManager';
    }

    protected get moveToTop(): boolean {
        return false;
    }

    public getFileTextByParam(value: string): IFileTextItem | undefined {
        let item = this._fileTexts.find((c, index) => {
            if (this.searchedSet.has(c)) {
                return false;
            }
            return c.param === value;
        });

        if (!item) {
            for (let i of this.searchedSet) {
                if (i && i.param === value) {
                    item = i;
                    break;
                }
            }
            this.searchedSet.clear();
        }

        if (item) {
            this.searchedSet.add(item);
        }

        return item;
    }

    public removeAllByParam(param: string) {
        this.checkFileTextsUpdate();
        this._fileTexts = this._fileTexts.filter((item) => item.param != param);
        this.fireAndSave(undefined);

        return true;
    }

    protected isFileTextItemEqual(a: IFileTextItem, b: IFileTextItem): boolean {
        if (a.param == 't' || b.param == 't') {
            // t为可重复添加的的特殊标签
            return false;
        }

        return a.param == b.param;
    }

    private sortBookmarks() {
        this._fileTexts.sort((a: IFileTextItem, b: IFileTextItem) => {
            if (!a.param) {
                return -1;
            }
            if (!b.param) {
                return 1;
            }

            if (a.param > b.param) {
                return 1;
            } else if (a.param < b.param) {
                return -1;
            } else {
                return fileTextLocationCompare(a, b);
            }
        });
    }
}
