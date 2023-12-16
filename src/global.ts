import * as path from 'path';

let storeFolder: string;
export function setStoreFolder(folder: string) {
    storeFolder = folder;
}
export function getStoreFolder() {
    return storeFolder;
}

export const PROJECT_ROOT = path.join(__filename, '..', '..');
export const RESOURCES_ROOT = path.join(PROJECT_ROOT, 'resources');

export enum commandList {
    showAllOpenedFiles = 'AllOpenedFiles.showAllOpenedFiles',
    quickOpen = 'AllOpenedFiles.quickOpen',

    insertLineNumber = 'AllOpenedFiles.insertLineNumber',

    pickAndPaste = 'ClipManager.pickAndPaste',
    ringPaste = 'ClipManager.ringPaste',

    apiGetMonitor = 'ClipManager.api.getMonitor',
    copyToHistory = 'ClipManager.copyToHistory',
    setClipboardValue = 'ClipManager.setClipboardValue',
    showClipboardInFile = 'ClipManager.showClipboardInFile',

    historyTreeDoubleClick = 'ClipManager.historyTree.doubleClick',
    clearClipboardHistory = 'ClipManager.history.clear',
    removeClipboardHistory = 'ClipManager.history.remove',

    addBookmark = 'BookmarkManager.addBookmark',
    removeBookmark = 'BookmarkManager.remove',
    showBookmarks = 'BookmarkManager.showBookmarks',
    showBookmarkInFile = 'BookmarkManager.showBookmarkInFile',
}

export const GIT_EXT = '.git';

export const EXT_PARAM_NOT_FOUND = 'not found';

export const DESCRIPTION_CONNECTOR_SYMBOL = '  ';
