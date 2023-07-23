import * as vscode from "vscode";

export interface IFileTextItem {
    value: string;
    param?: string;
    // lastUse?: number;
    addCount: number;
    updateCount: number;
    language?: string;
    createdAt: number; // 创建时间
    createdLocation?: vscode.Location;
}

export interface IFileTextChange {
    value: string;
    param?: string;
    language?: string;
    createdAt: number;
    createdLocation?: vscode.Location;

    isJustChangeLocation?: boolean;
    ignoreAddCount?: boolean;
}
