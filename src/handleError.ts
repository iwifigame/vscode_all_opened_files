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

process.on('uncaughtException', function (e) {
    const config = vscode.workspace.getConfiguration('fileheader') // 配置项默认值
    if (!config.configObj.showErrorMessage) return // 关闭报错
    const msg = JSON.stringify(e)
    vscode.window.showErrorMessage('fileHeader: uncaughtException崩溃', msg)
    writeLog('fileHeader: uncaughtException崩溃', msg)
})

// 每次重启插件都清空日志 防止日志过多
let content = ''

function writeLog(tag: string, msg = '') {
}
