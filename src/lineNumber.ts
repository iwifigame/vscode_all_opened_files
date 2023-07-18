import * as vscode from 'vscode';
import { InsertLineNumberConfig } from './configuration';

interface FormatQuickPickItem extends vscode.QuickPickItem {
    formatConfig: InsertLineNumberConfig.Format;
}

interface LineRange {
    start: number;
    end: number;
}

export function onActivate() {
    setupDefaultFormatConfigs();
}

export function execInsertLineNumber() {
    if (!vscode.window.activeTextEditor) {
        vscode.window.showWarningMessage("No activated editor.");
        return;
    }

    let quickPickItems = buildFormatQuickPickItems();
    if (quickPickItems.length == 1) {
        let item = quickPickItems[0];
        insertLineNumber(item.formatConfig, vscode.window.activeTextEditor!.selection);
    } else {
        vscode.window.showQuickPick(quickPickItems, {
            canPickMany: false,
            placeHolder: "Select a format (Define your own formats under 'InsertLineNumber.formats' in config file.)"
        }).then(item => {
            if (item) {
                insertLineNumber(item.formatConfig, vscode.window.activeTextEditor!.selection);
            }
        });
    }
}

function buildFormatQuickPickItems(): FormatQuickPickItem[] {
    const items = normalizedFormatConfigs.map((v) => ({
        formatConfig: v,
        label: buildSample(v),
        description: buildDescription(v),
    } as FormatQuickPickItem));

    return items;
}

function buildSample(formatConfig: InsertLineNumberConfig.Format): string {
    const { start, end } = getLineNumberRange(formatConfig);
    return `[${formatNumber(start, formatConfig)}]`
        + ` - [${formatNumber(end, formatConfig)}]`;
}

function buildDescription(formatConfig: InsertLineNumberConfig.Format): string {
    return JSON.stringify(formatConfig);
}

function getSelection(): LineRange {
    const editor = vscode.window.activeTextEditor!;

    const start = editor.selection.start.line;
    const end = editor.selection.end.line;

    if (start === end) {
        return { start: 0, end: editor.document.lineCount - 1 };
    } else {
        return { start, end };
    }
}

function getLineNumberRange(formatConfig: InsertLineNumberConfig.Format): LineRange {
    const { start, end } = getSelection();

    if (formatConfig.start === "current") {
        return { start: start + 1, end: end + 1 };
    } else {
        return { start: formatConfig.start!, end: formatConfig.start! + end - start };
    }
}

function formatNumber(
    n: number,
    formatConfig: InsertLineNumberConfig.Format,): string {

    let str = n.toString();

    if (formatConfig.width === "alignToLast") {
        const { end } = getLineNumberRange(formatConfig);
        str = padString(
            str,
            end.toString().length,
            formatConfig.padding === "zero" ? "0" : " ",
            formatConfig.align === "right");
    } else if (typeof formatConfig.width === 'number') {
        str = padString(
            str,
            formatConfig.width,
            formatConfig.padding === "zero" ? "0" : " ",
            formatConfig.align === "right");
    }

    return formatConfig.prefix + str + formatConfig.suffix;
}

function padString(str: string, width: number, paddingChar: string, padLeft: boolean): string {
    if (str.length >= width) {
        return str;
    }

    const padStr = paddingChar.repeat(width - str.length);
    return padLeft ? padStr + str : str + padStr;
}

function insertLineNumber(
    config: InsertLineNumberConfig.Format,
    selection: vscode.Selection): void {

    let ss = selection.start.line;
    let se = selection.end.line;

    const { start } = getLineNumberRange(config);

    vscode.window.activeTextEditor!.edit((editBuilder) => {
        for (let line = ss; line <= se; line++) {
            const lineNumber = formatNumber(start + line - ss, config);
            editBuilder.insert(new vscode.Position(line, 0), lineNumber);
        }
    });
}

function setupDefaultFormatConfigs() {
    const formatConfigs = vscode.workspace
        .getConfiguration("InsertLineNumber")
        .get("formats") as InsertLineNumberConfig.Format[];

    normalizedFormatConfigs = formatConfigs.map(v => fillDefaultForamt(v));
}

function fillDefaultForamt(formatConfig: InsertLineNumberConfig.Format): InsertLineNumberConfig.Format {
    return Object.assign({}, defaultFormat, formatConfig);
}

const defaultFormat: InsertLineNumberConfig.Format = {
    start: 1,
    align: "left",
    padding: "space",
    width: "normal",
    prefix: "",
    suffix: ":  "
};

let normalizedFormatConfigs: InsertLineNumberConfig.Format[];