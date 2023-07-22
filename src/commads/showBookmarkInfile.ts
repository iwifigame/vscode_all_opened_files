import * as vscode from "vscode";
import { BookmarkManager, IBookmarkItem } from "../manager/bookmarkManager";
import { BookmarkItem } from "../tree/bookmark";
import { commandList } from "../global";

export class ShowBookmarkInFile implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: BookmarkManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.showBookmarkInFile,
        this.execute,
        this
      )
    );
  }

  protected async execute(item: IBookmarkItem) {
    // const bookmark = item.bookmark;
    const bookmark = item;

    if (!bookmark.createdLocation) {
      return;
    }

    const uri = bookmark.createdLocation.uri;

    const document = await vscode.workspace.openTextDocument(uri);

    const opts: vscode.TextDocumentShowOptions = {
      viewColumn: vscode.ViewColumn.Active,
    };

    if (document.getText(bookmark.createdLocation.range) === bookmark.value) {
      opts.selection = bookmark.createdLocation.range;
    } else {
      // Find current position of value
      const indexes: number[] = [];
      const text = document.getText();
      let lastIndex = text.indexOf(bookmark.value);

      while (lastIndex >= 0) {
        indexes.push(lastIndex);
        lastIndex = text.indexOf(bookmark.value, lastIndex + 1);
      }

      if (indexes.length >= 0) {
        const offset = document.offsetAt(bookmark.createdLocation.range.start);

        // Sort by distance of initial location
        indexes.sort((a, b) => Math.abs(a - offset) - Math.abs(b - offset));

        const index = indexes[0];
        if (index >= 0) {
          const range = new vscode.Range(
            document.positionAt(index),
            document.positionAt(index + bookmark.value.length)
          );
          opts.selection = range;
        }
      }
    }

    await vscode.window.showTextDocument(document, opts);
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
