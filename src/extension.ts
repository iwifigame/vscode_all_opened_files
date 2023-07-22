"use strict";
import * as vscode from "vscode";
import * as os from "os";
import { defaultClipboard } from "./manager/clipboard";
import { ApiGetMonitor } from "./commads/apiGetMonitor";
import { ClearClipboardHistory } from "./commads/clearClipboardHistory";
import { HistoryTreeDoubleClickCommand } from "./commads/historyTreeDoubleClick";
import { PickAndPasteCommand } from "./commads/pickAndPaste";
import { RingPasteCommand } from "./commads/ringPaste";
import { RemoveClipboardHistory } from "./commads/removeClipboardHistory";
import { SetClipboardValueCommand } from "./commads/setClipboardValue";
import { ShowClipboardInFile } from "./commads/showClipboardInFile";
import { ShowBookmarkInFile } from "./commads/showBookmarkInfile";
import { ClipboardCompletion } from "./manager/clipboardCompletion";
import { ClipboardManager } from "./manager/clipboardManager";
import { ClipboardMonitor } from "./manager/clipboardMonitor";
import { ClipboardTreeDataProvider } from "./tree/history";
import { CopyToHistoryCommand } from "./commads/copyToHistory";
import { AddBookmarkCommand } from "./commads/addBookmark";
import { ShowAllOpenedFilesCommand } from "./commads/allOpenedFiles";
import { QuickOpenCommand } from "./commads/quickOpen";
import { InsertLineNumberCommand } from "./commads/insertLineNumber";

import { BookmarkTreeDataProvider } from "./tree/bookmark";
import { BookmarkManager } from "./manager/bookmarkManager";
import { setStoreFolder } from "./global";

let manager: ClipboardManager;
let bookmarkManager: BookmarkManager;

// this method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
    const disposable: vscode.Disposable[] = [];

    setExtensionStoreFolder(context);

    // Check the clipboard is working
    try {
        await defaultClipboard.readText(); // Read test
    } catch (error) {
        console.log(error);
        // Small delay to force show error
        // setTimeout(() => {
        //     if (error.message) {
        //         vscode.window.showErrorMessage(error.message);
        //     } else {
        //         vscode.window.showErrorMessage(
        //             "Failed to read value from clipboard, check the console log"
        //         );
        //     }
        // }, 2000);
        // Disable clipboard listening
        defaultClipboard.dispose();
        return;
    }

    // Add to disposable list the default clipboard
    disposable.push(defaultClipboard);

    const monitor = new ClipboardMonitor(defaultClipboard);
    disposable.push(monitor);

    manager = new ClipboardManager(context, monitor);
    disposable.push(manager);

    bookmarkManager = new BookmarkManager(context);
    disposable.push(bookmarkManager);

    // API Commands
    disposable.push(new ApiGetMonitor(monitor));

    // Commands
    disposable.push(new PickAndPasteCommand(manager));
    disposable.push(new RingPasteCommand(manager));
    disposable.push(new HistoryTreeDoubleClickCommand(manager));
    disposable.push(new SetClipboardValueCommand(manager));
    disposable.push(new RemoveClipboardHistory(manager));
    disposable.push(new ShowClipboardInFile(manager));
    disposable.push(new ClearClipboardHistory(manager));
    disposable.push(new CopyToHistoryCommand(monitor));
    disposable.push(new ShowAllOpenedFilesCommand());
    disposable.push(new QuickOpenCommand());
    disposable.push(new InsertLineNumberCommand());

    disposable.push(new AddBookmarkCommand(bookmarkManager));
    disposable.push(new ShowBookmarkInFile(bookmarkManager));

    const completion = new ClipboardCompletion(manager);
    // disposable.push(completion);

    // All files types
    disposable.push(
        vscode.languages.registerCompletionItemProvider(
            {
                scheme: "file",
            },
            completion
        )
    );

    // All files types (New file)
    disposable.push(
        vscode.languages.registerCompletionItemProvider(
            {
                scheme: "untitled",
            },
            completion
        )
    );

    const clipboardTreeDataProvider = new ClipboardTreeDataProvider(manager);
    disposable.push(clipboardTreeDataProvider);
    disposable.push(
        vscode.window.registerTreeDataProvider(
            "clipboardHistory",
            clipboardTreeDataProvider
        )
    );

    const bookmarkTreeDataProvider = new BookmarkTreeDataProvider(bookmarkManager);
    disposable.push(bookmarkTreeDataProvider);
    disposable.push(
        vscode.window.registerTreeDataProvider(
            "bookmark",
            bookmarkTreeDataProvider
        )
    );

    const updateConfig = () => {
        const config = vscode.workspace.getConfiguration("ClipManager");
        monitor.checkInterval = config.get("checkInterval", 500);
        monitor.onlyWindowFocused = config.get("onlyWindowFocused", true);
        monitor.maxClipboardSize = config.get("maxClipboardSize", 1000000);
    };
    updateConfig();

    disposable.push(
        vscode.workspace.onDidChangeConfiguration(
            e => e.affectsConfiguration("ClipManager") && updateConfig()
        )
    );

    context.subscriptions.push(...disposable);

    return {
        completion,
        manager,
        bookmarkManager,
    };
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (manager) {
        manager.saveClips();
    }
    if (bookmarkManager) {
        bookmarkManager.saveBookmarks();
    }
}

function setExtensionStoreFolder(context:vscode.ExtensionContext) {
    let folder = os.tmpdir(); // 得到操作系统临时目录
    // let folder = os.homedir(); // 得到用户根目录

    if (context.storagePath) {
        const parts = context.storagePath.split(
            /[\\/]workspaceStorage[\\/]/
        );
        folder = parts[0];
    }

    setStoreFolder(folder);
}
