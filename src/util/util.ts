import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

export interface IDisposable {
    dispose(): void;
}

export function toDisposable(dispose: () => void): IDisposable {
    return { dispose };
}

export function leftPad(
    value: string | number,
    size: number,
    char: string = " "
) {
    const chars = char.repeat(size);

    const paddedNumber = `${chars}${value}`.substr(-chars.length);

    return paddedNumber;
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getStoreFolder(context:vscode.ExtensionContext) {
    let folder = os.tmpdir(); // 得到操作系统临时目录

    if (context.storagePath) {
        const parts = context.storagePath.split(
            /[\\/]workspaceStorage[\\/]/
        );
        folder = parts[0];
    }

    return folder;
}
