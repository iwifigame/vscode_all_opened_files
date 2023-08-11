import * as vscode from "vscode";
import { BookmarkManager } from "../../manager/bookmarkManager";
import { commandList } from "../../global";
import { IFileTextItem } from "../../manager/common";
import { QuickBookmarkManager } from "../../manager/quickBookmarkManager";

export class ShowBookmarkInFileCommand implements vscode.Disposable {
    private _disposable: vscode.Disposable[] = [];

    constructor(protected _manager: BookmarkManager, protected _quickManager: QuickBookmarkManager) {
        this._disposable.push(
            vscode.commands.registerCommand(
                commandList.showBookmarkInFile,
                this.execute,
                this
            )
        );
    }

    protected async execute(mark: string, item: IFileTextItem) {
        let bookmark = item;
        if (mark) {
            let tmp = this._quickManager.getFileTextByParam(mark);
            if (tmp) {
                bookmark = tmp;
            }
        }

        if (!bookmark || !bookmark.createdLocation) {
            return;
        }


        const uri = bookmark.createdLocation.uri;
        const document = await vscode.workspace.openTextDocument(uri);

        const opts: vscode.TextDocumentShowOptions = {
            viewColumn: vscode.ViewColumn.Active,
        };
        opts.selection = bookmark.createdLocation.range;

        const rangeValue = document.getText(bookmark.createdLocation.range)
        if (rangeValue !== bookmark.value) { // 当前书签范围对应的文本与书签不匹配，则查找最近匹配的
            // Find current position of value
            const indexes: number[] = [];
            const text = document.getText();
            let lastIndex = text.indexOf(bookmark.value); // 找到第一个匹配的索引

            // 查找文档中所有匹配的索引
            while (lastIndex >= 0) {
                indexes.push(lastIndex);
                // 查找bookmark所在位置
                lastIndex = text.indexOf(bookmark.value, lastIndex + 1);
            }

            if (indexes.length >= 0) { // 找到了
                const offset = document.offsetAt(bookmark.createdLocation.range.start);

                // 根据离书签原始位置的距离，排序
                indexes.sort((a, b) => Math.abs(a - offset) - Math.abs(b - offset));

                const index = indexes[0]; // 取最近的一个位置
                if (index >= 0) {
                    const range = new vscode.Range(
                        document.positionAt(index), // 索引转position
                        document.positionAt(index + bookmark.value.length)
                    );
                    opts.selection = range;

                    // 更新书签位置范围
                    if (bookmark.createdLocation) {
                        bookmark.createdLocation.range = range
                    }
                }
            }
        }

        this._manager.updateFileTextByItem(bookmark);

        await vscode.window.showTextDocument(document, opts);
    }

    public dispose() {
        this._disposable.forEach(d => d.dispose());
    }
}
