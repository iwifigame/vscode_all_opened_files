"use strict";
import * as vscode from "vscode";
import * as os from "os";
import { setStoreFolder } from "./global";
import { defaultClipboard } from "./manager/clipboard";

import { FileManager } from "./manager/fileManager";
import { ShowAllOpenedFilesCommand } from "./commads/allOpenedFiles";
import { QuickOpenCommand } from "./commads/quickOpen";
import { InsertLineNumberCommand } from "./commads/insertLineNumber";

import { ClipboardManager } from "./manager/clipboardManager";
import { ClipboardMonitor } from "./manager/clipboardMonitor";
import { ClipboardCompletion } from "./manager/clipboardCompletion";
import { ClipboardTreeDataProvider } from "./tree/clipboardTree";
import { ApiGetMonitor } from "./commads/apiGetMonitor";
import { ClearClipboardHistory } from "./commads/clearClipboardHistory";
import { HistoryTreeDoubleClickCommand } from "./commads/historyTreeDoubleClick";
import { PickAndPasteCommand } from "./commads/pickAndPaste";
import { RingPasteCommand } from "./commads/ringPaste";
import { RemoveClipboardHistory } from "./commads/removeClipboardHistory";
import { SetClipboardValueCommand } from "./commads/setClipboardValue";
import { ShowClipboardInFile } from "./commads/showClipboardInFile";
import { CopyToHistoryCommand } from "./commads/copyToHistory";

import { BookmarkManager } from "./manager/bookmarkManager";
import { QuickBookmarkManager } from "./manager/quickBookmarkManager";
import { BookmarkTreeDataProvider } from "./tree/bookmarkTree";
import { AddBookmarkCommand } from "./commads/addBookmark";
import { RemoveBookmark } from "./commads/removeBookmark";
import { ShowBookmarkInFile } from "./commads/showBookmarkInfile";

let fileManager: FileManager;
let clipboardManager: ClipboardManager;
let bookmarkManager: BookmarkManager;
let quickBookmarkManager: QuickBookmarkManager;

// this method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
    const disposable: vscode.Disposable[] = [];

    // console.log(getCallerFileNameAndLine())
    // console.log(getCallerFileNameAndLine())
    // console.log(getCallerFileNameAndLine())

    // lineLogger(1111111)
    // lineLogger(2222222)

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

    clipboardManager = new ClipboardManager(context, monitor);
    disposable.push(clipboardManager);

    bookmarkManager = new BookmarkManager(context);
    disposable.push(bookmarkManager);

    quickBookmarkManager = new QuickBookmarkManager(context);
    disposable.push(quickBookmarkManager);

    fileManager = new FileManager(context);
    disposable.push(fileManager);

    // API Commands
    disposable.push(new ApiGetMonitor(monitor));

    // Commands
    disposable.push(new PickAndPasteCommand(clipboardManager));
    disposable.push(new HistoryTreeDoubleClickCommand(clipboardManager));
    disposable.push(new SetClipboardValueCommand(clipboardManager));
    disposable.push(new RemoveClipboardHistory(clipboardManager));
    disposable.push(new ShowClipboardInFile(clipboardManager));
    disposable.push(new ClearClipboardHistory(clipboardManager));
    disposable.push(new CopyToHistoryCommand(monitor));
    disposable.push(new RingPasteCommand(clipboardManager));

    disposable.push(new ShowAllOpenedFilesCommand(fileManager));
    disposable.push(new QuickOpenCommand(fileManager));
    disposable.push(new InsertLineNumberCommand());

    disposable.push(new AddBookmarkCommand(bookmarkManager, quickBookmarkManager));
    disposable.push(new RemoveBookmark(bookmarkManager, quickBookmarkManager));
    disposable.push(new ShowBookmarkInFile(bookmarkManager, quickBookmarkManager));

    const completion = new ClipboardCompletion(clipboardManager);
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

    const clipboardTreeDataProvider = new ClipboardTreeDataProvider(clipboardManager);
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

    const quickBookmarkTreeDataProvider = new BookmarkTreeDataProvider(quickBookmarkManager);
    disposable.push(quickBookmarkTreeDataProvider);
    disposable.push(
        vscode.window.registerTreeDataProvider(
            "quick bookmark",
            quickBookmarkTreeDataProvider
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
        manager: clipboardManager,
        bookmarkManager,
        quickBookmarkManager,
    };
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (clipboardManager) {
        clipboardManager.savefileTexts();
    }
    if (bookmarkManager) {
        bookmarkManager.savefileTexts();
    }
    if (quickBookmarkManager) {
        quickBookmarkManager.savefileTexts();
    }
    if (fileManager) {
        fileManager.savefileTexts();
    }
}

function setExtensionStoreFolder(context: vscode.ExtensionContext) {
    let folder = os.tmpdir(); // 得到操作系统临时目录
    // let folder = os.homedir(); // 得到用户根目录

    // if (context.storagePath) {
    //     const parts = context.storagePath.split(
    //         /[\\/]workspaceStorage[\\/]/
    //     );
    //     folder = parts[0];
    // }

    setStoreFolder(folder);
}
