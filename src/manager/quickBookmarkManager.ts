import * as vscode from 'vscode';
import * as path from "path";
import { IFileTextItem } from "./common";
import { BookmarkManager } from "./bookmarkManager";
import { decoration } from '../util/decorationUtil';
import { pathEqual } from '../util/util';

export class QuickBookmarkManager extends BookmarkManager {
    protected init() {
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

    protected isFileTextItemEqual(a: IFileTextItem, b: IFileTextItem): boolean {
        return a.param == b.param
    }

    protected sortBookmarks() {
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
