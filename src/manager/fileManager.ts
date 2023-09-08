import * as vscode from "vscode";
import { AbstractManager } from "./abstractManager";
import { IFileTextItem, fileTextLocationCompare } from "./common";

export class FileManager extends AbstractManager {
    getConfigName(): string {
        return "FileManager";
    }

    protected get maxfileTexts(): number {
        const config = vscode.workspace.getConfiguration(this.getConfigName());
        return config.get("maxfileTexts", 10000);
    }
}
