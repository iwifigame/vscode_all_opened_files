import * as path from "path";
import { AbstractManager as AbstractManager } from "./abstractManager";
import { IFileTextItem } from "./common";

export class BookmarkManager extends AbstractManager {
    public getConfigName(): string {
        return "BookmarkManager";
    }

    protected preSave(): void {
        this.sortBookmarks();
    };

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

    protected sortBookmarks() {
        this._fileTexts.sort((a: IFileTextItem, b: IFileTextItem) => {
            let ta = a.createdLocation?.uri.path;
            let tb = b.createdLocation?.uri.path;

            if (!ta) {
                return -1;
            }

            if (!tb) {
                return 1;
            }

            let ua = path.basename(ta).toLowerCase();
            let ub = path.basename(tb).toLowerCase();

            if (ua > ub) {
                return 1;
            } else if (ua < ub) {
                return -1;
            } else {
                let va = a.value;
                let vb = a.value;
                if (va > vb) {
                    return -1;
                } else if (va < vb) {
                    return 1;
                } else {
                    return 0;
                }
            }
        });
    }
}
