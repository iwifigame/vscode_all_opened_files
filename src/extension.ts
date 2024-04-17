// "use strict";
import * as os from 'os';
import * as vscode from 'vscode';
import { setStoreFolder } from './global';
import { defaultClipboard } from './manager/clipboard';

import { InsertLineNumberCommand } from './commands/insertLineNumber';
import { QuickOpenCommand } from './commands/quickOpen';
import { PreFunctionCommand } from './commands/preFunction';
import { NextFunctionCommand } from './commands/nextFunction';
import { ShowAllOpenedFilesCommand } from './commands/showAllOpenedFiles';
import { FileManager } from './manager/fileManager';

import { ApiGetMonitor } from './commands/clipboard/apiGetMonitor';
import { ClearClipboardHistoryCommand } from './commands/clipboard/clearClipboardHistory';
import { CopyToHistoryCommand } from './commands/clipboard/copyToHistory';
import { HistoryTreeDoubleClickCommand } from './commands/clipboard/historyTreeDoubleClick';
import { PickAndPasteCommand } from './commands/clipboard/pickAndPaste';
import { RemoveClipboardHistoryCommand } from './commands/clipboard/removeClipboardHistory';
import { RingPasteCommand } from './commands/clipboard/ringPaste';
import { SetClipboardValueCommand } from './commands/clipboard/setClipboardValue';
import { ShowClipboardInFileCommand } from './commands/clipboard/showClipboardInFile';
import { ClipboardCompletion } from './manager/clipboardCompletion';
import { ClipboardManager } from './manager/clipboardManager';
import { ClipboardMonitor } from './manager/clipboardMonitor';
import { ClipboardTreeDataProvider } from './tree/clipboardTree';

import { AddBookmarkCommand } from './commands/bookmark/addBookmark';
import { RemoveBookmarkCommand } from './commands/bookmark/removeBookmark';
import { ShowBookmarkInFileCommand } from './commands/bookmark/showBookmarkInfile';
import { ClearQuickBookmarkCommand } from './commands/bookmark/clearQuickBookmark';
import { ShowBookmarksCommand } from './commands/bookmark/showBookmarks';
import { BookmarkManager } from './manager/bookmarkManager';
import { QuickBookmarkManager } from './manager/quickBookmarkManager';
import { BookmarkTreeDataProvider } from './tree/bookmarkTree';
import { DEBUG, ERROR, FATAL, INFO, TRACE, WARN, log } from './util/logger';
import { UnityShaderFormattingEditProvider } from './shaderFormater';

let fileManager: FileManager;
let clipboardManager: ClipboardManager;
let bookmarkManager: BookmarkManager;
let quickBookmarkManager: QuickBookmarkManager;

export async function activate(context: vscode.ExtensionContext) {
    const disposable: vscode.Disposable[] = [];

    let f = vscode.languages.registerDocumentFormattingEditProvider(
        'UnityShader',
        new UnityShaderFormattingEditProvider(),
    );
    disposable.push(f);

    // handleUncaughtException();
    // throw new Error('这是一个异常');

    // testLog();

    setExtensionStoreFolder(context);

    let clipboardMonitor = getDefaultClipboardMonitor();

    initConfig(disposable, clipboardMonitor);

    initCommand(disposable, clipboardMonitor);

    initCompletion(disposable);

    initTreeView(disposable);

    context.subscriptions.push(...disposable);
}

function testLog() {
    console.log('------------ testLog start ------------ ');
    // setLogLevel(LogLevel.TRACE);
    TRACE('111111111111111111111');
    DEBUG('111111111111111111111');
    log('111111111111111111111');
    INFO('111111111111111111111');
    WARN('111111111111111111111');
    ERROR('111111111111111111111');
    FATAL('111111111111111111111');
    console.log('------------ testLog end ------------ ');
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

function initConfig(disposable: vscode.Disposable[], clipboardMonitor: ClipboardMonitor) {
    const updateConfig = () => {
        const config = vscode.workspace.getConfiguration('ClipManager');
        clipboardMonitor.checkInterval = config.get('checkInterval', 500);
        clipboardMonitor.onlyWindowFocused = config.get('onlyWindowFocused', true);
        clipboardMonitor.maxClipboardSize = config.get('maxClipboardSize', 1000000);
    };
    updateConfig();

    disposable.push(
        vscode.workspace.onDidChangeConfiguration(
            (e) => e.affectsConfiguration('ClipManager') && updateConfig(),
        ),
    );
}

function initCommand(disposable: vscode.Disposable[], clipboardMonitor: ClipboardMonitor) {
    fileManager = new FileManager();
    clipboardManager = new ClipboardManager(clipboardMonitor);
    bookmarkManager = new BookmarkManager();
    quickBookmarkManager = new QuickBookmarkManager();

    const list: vscode.Disposable[] = [
        defaultClipboard,
        clipboardMonitor,

        fileManager,
        clipboardManager,
        bookmarkManager,
        quickBookmarkManager,

        // API Commands
        new ApiGetMonitor(clipboardMonitor),

        // Commands
        new PickAndPasteCommand(clipboardManager),
        new HistoryTreeDoubleClickCommand(clipboardManager),
        new SetClipboardValueCommand(clipboardManager),
        new RemoveClipboardHistoryCommand(clipboardManager),
        new ShowClipboardInFileCommand(clipboardManager),
        new ClearClipboardHistoryCommand(clipboardManager),
        new CopyToHistoryCommand(clipboardMonitor),
        new RingPasteCommand(clipboardManager),

        new ShowAllOpenedFilesCommand(fileManager),
        new QuickOpenCommand(fileManager),
        new PreFunctionCommand(),
        new NextFunctionCommand(),
        new InsertLineNumberCommand(),

        new AddBookmarkCommand(bookmarkManager, quickBookmarkManager),
        new RemoveBookmarkCommand(bookmarkManager, quickBookmarkManager),
        new ShowBookmarksCommand(bookmarkManager, quickBookmarkManager),
        new ShowBookmarkInFileCommand(bookmarkManager, quickBookmarkManager),
        new ClearQuickBookmarkCommand(quickBookmarkManager),
    ];

    list.forEach((element) => {
        disposable.push(element);
    });
}

function initCompletion(disposable: vscode.Disposable[]) {
    const completion = new ClipboardCompletion(clipboardManager);
    // disposable.push(completion);

    // All files types
    disposable.push(
        vscode.languages.registerCompletionItemProvider(
            {
                scheme: 'file',
            },
            completion,
        ),
    );

    // All files types (New file)
    disposable.push(
        vscode.languages.registerCompletionItemProvider(
            {
                scheme: 'untitled',
            },
            completion,
        ),
    );
}

function initTreeView(disposable: vscode.Disposable[]) {
    const clipboardTreeDataProvider = new ClipboardTreeDataProvider(clipboardManager);
    disposable.push(clipboardTreeDataProvider);
    disposable.push(
        vscode.window.registerTreeDataProvider('clipboardHistory', clipboardTreeDataProvider),
    );

    const bookmarkTreeDataProvider = new BookmarkTreeDataProvider(bookmarkManager);
    disposable.push(bookmarkTreeDataProvider);
    const treeView = vscode.window.createTreeView('bookmark', {
        treeDataProvider: bookmarkTreeDataProvider,
    });
    disposable.push(treeView);
    bookmarkTreeDataProvider.setTreeView(treeView);

    const quickBookmarkTreeDataProvider = new BookmarkTreeDataProvider(quickBookmarkManager);
    disposable.push(quickBookmarkTreeDataProvider);
    const quickTreeView = vscode.window.createTreeView('quickBookmark', {
        treeDataProvider: quickBookmarkTreeDataProvider,
    });
    disposable.push(quickTreeView);
    quickBookmarkTreeDataProvider.setTreeView(quickTreeView);
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (clipboardManager) {
        clipboardManager.saveFileTexts();
    }
    if (bookmarkManager) {
        bookmarkManager.saveFileTexts();
    }
    if (quickBookmarkManager) {
        quickBookmarkManager.saveFileTexts();
    }
    if (fileManager) {
        fileManager.saveFileTexts();
    }
}

function getDefaultClipboardMonitor() {
    defaultClipboard.readText().then(
        (s: string) => { },
        (error: Error) => {
            console.log(error);
            // Small delay to force show error
            setTimeout(() => {
                if (error.message) {
                    vscode.window.showErrorMessage(error.message);
                } else {
                    vscode.window.showErrorMessage(
                        'Failed to read value from clipboard, check the console log',
                    );
                }
            }, 2000);
            // Disable clipboard listening
            defaultClipboard.dispose();
        },
    );

    return new ClipboardMonitor(defaultClipboard);
}
