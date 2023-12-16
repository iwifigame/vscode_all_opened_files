/*
import axios from 'axios'
import { EXTENSION_LOG_URL } from '../global'

const service = axios.create({
    baseURL: EXTENSION_LOG_URL,
    timeout: 99999
})

export const EXTENSION_LOG_URL = ""
export enum ExtensionLog {
}
export async function uploadExtensionLog(elog: ExtensionLog, msg = '') {
    const extension = vscode.extensions.getExtension("liyongjin.all-opened-files")
    let version = extension?.packageJSON.version

    let appLog = {
        App: "allOpenedFiles",
        Version: version,
        VKey: elog,
    }
    await uploadAppLog(appLog)
}

const uploadAppLog = (data: any) => {
    return service({
        url: '/appLog/uploadAppLog',
        method: 'post',
        data
    })
}

export default service
*/
