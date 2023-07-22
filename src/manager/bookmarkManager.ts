import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { getStoreFolder } from "../global";

export interface IBookmarkItem {
    value: string;
    createdAt: number;
    lastUse?: number;
    copyCount: number;
    useCount: number;
    language?: string;
    createdLocation?: vscode.Location;
}

export interface IBookmarkTextChange {
    value: string;
    timestamp: number;
    language?: string;
    location?: vscode.Location;
}

export class BookmarkManager implements vscode.Disposable {
    protected _disposable: vscode.Disposable[] = [];

    protected _bookmarks: IBookmarkItem[] = [];
    get bookmarks() {
        return this._bookmarks;
    }

    protected lastUpdate: number = 0;

    private _onDidBookmarkListChange = new vscode.EventEmitter<void>();
    public readonly onDidChangeBookmarkList = this._onDidBookmarkListChange.event;

    constructor( protected context: vscode.ExtensionContext) {
        this.loadBookmarks();

        vscode.window.onDidChangeWindowState(
            state => {
                if (state.focused) {
                    this.checkBookmarksUpdate();
                }
            },
            this,
            this._disposable
        );

        vscode.workspace.onDidChangeConfiguration(
            e => e.affectsConfiguration("BookmarkManager") && this.saveBookmarks()
        );
    }

    public addBookmark(change: IBookmarkTextChange) {
        this.checkBookmarksUpdate();

        const config = vscode.workspace.getConfiguration("BookmarkManager");
        const maxbookmarks = config.get("maxbookmarks", 100);
        const avoidDuplicates = config.get("avoidDuplicates", true);

        let item: IBookmarkItem = {
            value: change.value,
            createdAt: change.timestamp,
            copyCount: 1,
            useCount: 0,
            language: change.language,
            createdLocation: change.location,
        };

        if (avoidDuplicates) {
            const index = this._bookmarks.findIndex(c => c.value === change.value);

            // Remove same bookmarks and move recent to top
            if (index >= 0) {
                this._bookmarks[index].copyCount++;
                item = this._bookmarks[index];
                this._bookmarks = this._bookmarks.filter(c => c.value !== change.value);
            }
        }

        // Add to top
        this._bookmarks.unshift(item);

        // Max bookmarks to store
        if (maxbookmarks > 0) {
            this._bookmarks = this._bookmarks.slice(0, maxbookmarks);
        }

        this._onDidBookmarkListChange.fire();

        this.saveBookmarks();
    }

    public async setBookmarkValue(value: string) {
        this.checkBookmarksUpdate();

        const config = vscode.workspace.getConfiguration("BookmarkManager");
        const moveToTop = config.get("moveToTop", true);

        const index = this._bookmarks.findIndex(c => c.value === value);

        if (index >= 0) {
            this._bookmarks[index].useCount++;

            if (moveToTop) { // 移到头部
                const bookmarks = this.bookmarks.splice(index, 1); // 删除index处一个元素，即将当前元素删除
                this._bookmarks.unshift(...bookmarks); // 重新插入bookmarks
                this._onDidBookmarkListChange.fire();
                this.saveBookmarks();
            }
        }
    }

    public removeBookmarkValue(value: string) {
        this.checkBookmarksUpdate();

        const prevLength = this._bookmarks.length;

        this._bookmarks = this._bookmarks.filter(c => c.value !== value);
        this._onDidBookmarkListChange.fire();
        this.saveBookmarks();

        return prevLength !== this._bookmarks.length;
    }

    public clearAll() {
        this.checkBookmarksUpdate();

        this._bookmarks = [];
        this._onDidBookmarkListChange.fire();
        this.saveBookmarks();

        return true;
    }

    protected getStoreFile() {
        let folder =  getStoreFolder()
        const filePath = path.join(folder, ".bookmark.json");

        const config = vscode.workspace.getConfiguration("BookmarkManager");
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

    public saveBookmarks() {
        const file = this.getStoreFile();
        if (!file) {
            return;
        }

        let json = "[]";
        try {
            json = JSON.stringify(
                {
                    version: 2,
                    bookmarks: this._bookmarks,
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

    /**
     * Check the clip history changed from another workspace
     */
    public checkBookmarksUpdate() {
        const file = this.getStoreFile();

        if (!file) {
            return;
        }

        if (!fs.existsSync(file)) {
            return;
        }

        const stat = fs.statSync(file);

        if (this.lastUpdate < stat.mtimeMs) {
            this.lastUpdate = stat.mtimeMs;
            this.loadBookmarks();
        }
    }

    public loadBookmarks() {
        let json:string = "";

        const file = this.getStoreFile();

        if (file && fs.existsSync(file)) {
            try {
                json = fs.readFileSync(file).toString();
                this.lastUpdate = fs.statSync(file).mtimeMs;
            } catch (error) {
                // ignore
            }
        }

        if (!json) {
            return;
        }

        let stored: any = {};

        try {
            stored = JSON.parse(json);
        } catch (error) {
            console.log(error);
            return;
        }

        if (!stored.version || !stored.bookmarks) {
            return;
        }

        let bookmarks = stored.bookmarks as any[];

        if (stored.version === 1) {
            bookmarks = bookmarks.map(c => {
                c.createdAt = c.timestamp;
                c.copyCount = 1;
                c.useCount = 0;
                c.createdLocation = c.location;
                return c;
            });
            stored.version = 2;
        }

        this._bookmarks = bookmarks.map(c => {
            const bookmark: IBookmarkItem = {
                value: c.value,
                createdAt: c.createdAt,
                copyCount: c.copyCount,
                useCount: c.copyCount,
                language: c.language,
            };

            if (c.createdLocation) {
                const uri = vscode.Uri.parse(c.createdLocation.uri);
                const range = new vscode.Range(
                    c.createdLocation.range.start.line,
                    c.createdLocation.range.start.character,
                    c.createdLocation.range.end.line,
                    c.createdLocation.range.end.character
                );
                bookmark.createdLocation = new vscode.Location(uri, range);
            }

            return bookmark;
        });

        this._onDidBookmarkListChange.fire();
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
