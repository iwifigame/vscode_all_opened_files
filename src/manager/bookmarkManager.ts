import * as path from "path";
import { AbstractManager as AbstractManager } from "./abstractManager";
import { IFileTextItem, fileTextLocationCompare } from "./common";

export class BookmarkManager extends AbstractManager {
    protected init() {
        this.onDidChangeFileTextList((item: IFileTextItem) => {
            this.sortBookmarks();
        });
    }

    public getConfigName(): string {
        return "BookmarkManager";
    }

    protected get moveToTop(): boolean {
        return false
    }

    protected isFileTextItemEqual(a: IFileTextItem, b: IFileTextItem): boolean {
        if (a.createdLocation?.uri.path == b.createdLocation?.uri.path) {
            if (a.createdLocation?.range && b.createdLocation?.range) {
                if (a.createdLocation?.range.start.line == b.createdLocation?.range.start.line) {
                    if (a.value == b.value) {
                        return true
                    }
                }
            }
        }
        return false
    }

    private sortBookmarks() {
        this._fileTexts.sort((a: IFileTextItem, b: IFileTextItem) => {
            return fileTextLocationCompare(a, b)
        });
    }
}
