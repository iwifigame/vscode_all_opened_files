import * as vscode from 'vscode';

export const showErrorMessage = (tag: string, e: any) => {
    const config = vscode.workspace.getConfiguration('fileheader') // 配置项默认值
    if (!config.configObj.showErrorMessage) return // 关闭报错
    if (typeof e !== 'string') {
        e = `message: ${e.message}\nstack: ${e.stack}`
    }
    writeLog(tag, e)
    vscode.window.showErrorMessage(tag, e)
}

export function handleUncaughtException() {
    process.on('uncaughtException', function (e) {
        // const config = vscode.workspace.getConfiguration('fileheader') // 配置项默认值
        // if (!config.configObj.showErrorMessage) return // 关闭报错
        const msg = JSON.stringify(e)
        vscode.window.showErrorMessage('allOpenedFiles: uncaughtException崩溃', msg)
        // writeLog('fileHeader: uncaughtException崩溃', msg)
    })

    // process.on('error', (error: any) => {
    //     console.error('发生错误：', error);
    //     // 在这里处理错误
    // });
}



function writeLog(tag: string, msg = '') {
}
