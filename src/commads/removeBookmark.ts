import * as vscode from "vscode";
import { BookmarkItem } from "../tree/bookmark";
import { commandList } from "../global";
import { BookmarkManager } from "../manager/bookmarkManager";

export class RemoveBookmark implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: BookmarkManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.removeBookmark,
        this.execute,
        this
      )
    );
  }

  protected async execute(value: string | BookmarkItem) {
    if (value instanceof BookmarkItem) {
      value = value.bookmark.value;
    }

    await this._manager.removeBookmarkValue(value);
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
