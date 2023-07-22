// 添加文件、LRU更新当前操作文件成最新
export function updateLRUFiles(files: Array<string>, curFile: string) {
    // 查找文件
    const index = files.findIndex((item) => {
        return item === curFile
    })

    let item: string
    if (index !== -1) { // 找到了，则删除，再插入
        if (index !== 0) {
            item = files[index]
            files.splice(index, 1) // 删除
            if (item.length >= 0) {
                files.unshift(item)
            }
        }
    } else { // 没有找到，则插入新的
        // 插入新的元素 维护数组的最大值10个
        // todo config
        if (files.length >= 10000) {
            files.shift() // 删除不活跃的文件
        }
        item = curFile
        files.unshift(item)
    }

    return files
}

export function deleteLRUFiles(files: Array<string>, curFile: string) {
    // 查找文件
    const index = files.findIndex((item) => {
        return item === curFile
    })

    let item: string
    if (index !== -1) { // 找到了，则删除，再插入
        item = files[index]
        files.splice(index, 1) // 删除
    }

    return files
}