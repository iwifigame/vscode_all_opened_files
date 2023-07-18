import * as vscode from 'vscode';
import * as LineNumberInserter from "./lineNumber";
import * as AllOpenedFiles from "./allOpendFile";

export function activate(context: vscode.ExtensionContext) {
	console.log('is now active.' + context.extensionPath);

	AllOpenedFiles.onActivate()

	LineNumberInserter.onActivate();

	context.subscriptions.push(vscode.commands.registerCommand('extension.insertLineNumber', () => {
		LineNumberInserter.execInsertLineNumber();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('extension.showAllOpenedFiles', () => {
		AllOpenedFiles.execShowAllOpenedFiles();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('extension.quickOpen', (path) => {
		AllOpenedFiles.execQuickOpen(path);
	}));
}

export function deactivate() {
}