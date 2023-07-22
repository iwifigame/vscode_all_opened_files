export let AllOpenedFiles: Array<string> = [];

let storeFolder: string;
export function setStoreFolder(folder: string) {
    storeFolder = folder;
}
export function getStoreFolder() {
    return storeFolder;
}

export enum commandList {
    showAllOpenedFiles = "AllOpenedFiles.showAllOpenedFiles",
    quickOpen = "AllOpenedFiles.quickOpen",
    insertLineNumber = "AllOpenedFiles.insertLineNumber",

    pickAndPaste = "ClipManager.pickAndPaste",
    ringPaste = "ClipManager.ringPaste",

    apiGetMonitor = "ClipManager.api.getMonitor",
    copyToHistory = "ClipManager.copyToHistory",
    setClipboardValue = "ClipManager.setClipboardValue",
    showClipboardInFile = "ClipManager.showClipboardInFile",

    historyTreeDoubleClick = "ClipManager.historyTree.doubleClick",

    clearClipboardHistory = "ClipManager.history.clear",
    removeClipboardHistory = "ClipManager.history.remove",


    addBookmark = "BookmarkManager.addBookmark",
    showBookmarkInFile = "BookmarkManager.showBookmarkInFile",
}