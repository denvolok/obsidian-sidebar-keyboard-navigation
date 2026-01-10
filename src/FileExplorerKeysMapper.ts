import { FileExplorerActions } from "./FileExplorerActions";
import { PluginSettings } from "./PluginData";
import { App, FileExplorerView, View } from "obsidian";

import { isFileNode, KeysMapper } from "./types";

export class FileExplorerKeysMapper implements KeysMapper {
	private app: App;
	private actions: FileExplorerActions;

	constructor(app: App, settings: PluginSettings) {
		this.app = app;
		this.actions = new FileExplorerActions(settings, app);
	}

	public async handleKeyPress(event: KeyboardEvent): Promise<void> {
		const focusedNode = (this.app.workspace.getActiveViewOfType(View) as FileExplorerView).tree
			.focusedItem;

		if (event.shiftKey) {
			switch (event.code) {
				case "KeyZ": {
					this.actions.collapseAllFolders();
					break;
				}
				case "KeyN": {
					if (focusedNode == null) {
						return;
					}
					this.actions.createNewNode(focusedNode, { nodeType: "file", context: "parent" });
					break;
				}
				case "KeyF": {
					if (focusedNode == null) {
						return;
					}
					this.actions.createNewNode(focusedNode, { nodeType: "folder", context: "parent" });
					break;
				}
				case "KeyD": {
					if (focusedNode == null) {
						return;
					}
					this.actions.deleteNodeAndFocusNext(focusedNode);
					break;
				}
				case "KeyS": {
					if (focusedNode != null && isFileNode(focusedNode)) {
						await this.actions.openFocusedFileInNewSplit(focusedNode, {
							direction: "vertical",
							shouldFocus: false,
						});
					}
					break;
				}
				case "KeyI": {
					if (focusedNode != null && isFileNode(focusedNode)) {
						await this.actions.openFocusedFileInNewSplit(focusedNode, {
							direction: "horizontal",
							shouldFocus: false,
						});
					}
					break;
				}
				case "KeyL": {
					if (focusedNode == null) {
						return;
					}

					if (isFileNode(focusedNode)) {
						await this.actions.openFile(focusedNode, event, {
							shouldFocus: false,
							shouldPreventDuplicate: true,
						});
					} else {
						this.actions.recursivelySetFolderCollapsed(focusedNode, { isCollapsed: false });
					}
					break;
				}
				case "KeyH": {
					if (focusedNode == null) {
						return;
					}

					if ("collapsed" in focusedNode && !focusedNode.collapsed) {
						this.actions.recursivelySetFolderCollapsed(focusedNode, { isCollapsed: true });
					} else {
						this.actions.focusParentNode(focusedNode);
					}
					break;
				}
				case "KeyG": {
					this.actions.focusLastRootNode();
					break;
				}
				case "KeyT": {
					if (focusedNode != null && isFileNode(focusedNode)) {
						await this.actions.backgroundOpenFileInNewTab(focusedNode);
					}
					break;
				}
				case "KeyJ": {
					this.actions.moveFocusDown(event);

					const newFocusedNode = (this.app.workspace.getActiveViewOfType(View) as FileExplorerView)
						.tree.focusedItem;

					if (newFocusedNode != null && isFileNode(newFocusedNode)) {
						await this.actions.openFile(newFocusedNode, event, {
							shouldFocus: false,
							shouldPreventDuplicate: false,
						});
					}
					break;
				}
				case "KeyK": {
					this.actions.moveFocusUp(event);

					const newFocusedNode = (this.app.workspace.getActiveViewOfType(View) as FileExplorerView)
						.tree.focusedItem;

					if (newFocusedNode != null && isFileNode(newFocusedNode)) {
						await this.actions.openFile(newFocusedNode, event, {
							shouldFocus: false,
							shouldPreventDuplicate: false,
						});
					}
					break;
				}
				case "KeyV": {
					this.actions.clearSelectedNodes();
					break;
				}
				default:
			}
		} else {
			switch (event.code) {
				case "Semicolon": {
					if (focusedNode == null) {
						return;
					}
					this.actions.toggleContextMenu(focusedNode);
					break;
				}
				case "KeyJ": {
					this.actions.moveFocusDown(event);
					break;
				}
				case "KeyK": {
					this.actions.moveFocusUp(event);
					break;
				}
				case "KeyH": {
					if (focusedNode == null) {
						return;
					}
					this.actions.collapseCurrentFolder(event);
					break;
				}
				case "KeyL": {
					if (focusedNode == null) {
						return;
					}

					if (isFileNode(focusedNode)) {
						await this.actions.openFile(focusedNode, event, {
							shouldFocus: true,
							shouldPreventDuplicate: true,
						});
					} else {
						this.actions.expandFolder(event);
					}
					break;
				}
				case "KeyS": {
					if (focusedNode != null && isFileNode(focusedNode)) {
						await this.actions.openFocusedFileInNewSplit(focusedNode, {
							direction: "vertical",
							shouldFocus: true,
						});
					}
					break;
				}
				case "KeyI": {
					if (focusedNode != null && isFileNode(focusedNode)) {
						await this.actions.openFocusedFileInNewSplit(focusedNode, {
							direction: "horizontal",
							shouldFocus: true,
						});
					}
					break;
				}
				case "KeyN": {
					if (focusedNode == null) {
						return;
					}
					this.actions.createNewNode(focusedNode, { nodeType: "file", context: "current" });
					break;
				}
				case "KeyF": {
					if (focusedNode == null) {
						return;
					}
					this.actions.createNewNode(focusedNode, { nodeType: "folder", context: "current" });
					break;
				}
				case "KeyC": {
					if (focusedNode == null) {
						return;
					}
					await this.actions.cloneNode(focusedNode);
					break;
				}
				case "KeyR": {
					if (focusedNode == null) {
						return;
					}
					this.actions.renameNode(event);
					break;
				}
				case "KeyG": {
					this.actions.focusFirstRootNode();
					break;
				}
				case "KeyT": {
					if (focusedNode != null && isFileNode(focusedNode)) {
						await this.actions.openFileInNewTab(focusedNode);
					}
					break;
				}
				case "KeyV": {
					if (focusedNode == null) {
						return;
					}
					this.actions.toggleNodeSelection(focusedNode);
					break;
				}
				case "KeyW": {
					if (focusedNode != null && isFileNode(focusedNode)) {
						await this.actions.openFileInNewWindow(focusedNode);
					}
					break;
				}
				case "KeyO": {
					if (focusedNode != null && isFileNode(focusedNode)) {
						await this.actions.toggleFilePreviewPopup(focusedNode);
					}
					break;
				}
				default:
			}
		}
	}
}
