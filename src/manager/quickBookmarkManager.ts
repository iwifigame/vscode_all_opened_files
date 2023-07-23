import * as path from "path";
import { IFileTextChange, IFileTextItem } from "./common";
import { BookmarkManager } from "./bookmarkManager";

export class QuickBookmarkManager extends BookmarkManager {
    public getConfigName(): string {
        return "QuickBookmarkManager";
    }

    protected duplicatesCompare(item: IFileTextItem, change: IFileTextChange): boolean {
        if (item.param == change.param) {
            return true
        }
        return false
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
