import * as vscode from 'vscode';
import { IFileTextItem } from "./common";
import { decoration } from '../util/decorationUtil';
import { pathEqual } from '../util/util';
import { AbstractManager } from './abstractManager';

export class QuickBookmarkManager extends AbstractManager {
    protected init() {
        this.onDidChangeFileTextList((item: IFileTextItem) => {
            this.sortBookmarks();
        });

        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (!editor) {
                return
            }

            let doc = editor.document
            if (doc == undefined) {
                return
            }
            this.fileTexts.forEach(
                item => {
                    if (!item.param || !item.createdLocation) {
                        return
                    }

                    let pa = item.createdLocation.uri.path;
                    let pb = doc.fileName;
                    if (pathEqual(pa, pb)) {
                        let m = decoration.getOrCreateMarkDecoration(item.param);
                        if (item.createdLocation) {
                            editor.setDecorations(m, [item.createdLocation.range]);
                        }
                    }
                }
            );
        })
    }

    public getConfigName(): string {
        return "QuickBookmarkManager";
    }

    protected get moveToTop(): boolean {
        return false
    }

    public removeAllByParam(param: string) {
        this.checkFileTextsUpdate();
        this._fileTexts = this._fileTexts.filter(item => item.param != param)
        this.fireAndSave(undefined)

        return true
    }

    protected isFileTextItemEqual(a: IFileTextItem, b: IFileTextItem): boolean {
        if (a.param == "t" || b.param == "t") { // t用来快速添加可重复的临时标签，可用来作为添加todo等用途
            return false
        }

        return a.param == b.param
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
                return 0;
            }
        });
    }
}
