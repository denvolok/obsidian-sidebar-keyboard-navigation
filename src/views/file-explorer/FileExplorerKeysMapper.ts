import { FileExplorerActions } from "./FileExplorerActions";
import { PluginSettings } from "../../plugin-data/PluginData";
import { App, FileExplorerView, View } from "obsidian";

import { domUtils } from "../../utils/utils";
import { KeysMapper } from "../../KeysMapper";
import { isFileNode } from "./file-explorer-utils";

const keysHelp = [
	{ key: "?", action: "Toggle this help menu" },
	{ key: "j", action: "Move down" },
	{ key: "J", action: "Move down and preview file" },
	{ key: "k", action: "Move up" },
	{ key: "K", action: "Move up and preview file" },
	{ key: "g", action: "Focus the topmost root node" },
	{ key: "G", action: "Focus the bottommost root node" },
	{ key: "v", action: "Toggle node selection" },
	{ key: "V", action: "Deselect all nodes" },
	{ key: ";", action: "Toggle context menu" },
	{ key: "h", action: "Close current folder" },
	{ key: "H", action: "Close current folder recursively" },
	{ key: "l", action: "Open folder/file" },
	{ key: "L", action: "Open folder recursively, or file in background" },
	{ key: "Z", action: "Close all folders" },
	{ key: "s", action: "Open file in a new vertical split" },
	{ key: "S", action: "Background-open file in a new vertical split" },
	{ key: "i", action: "Open file in a new horizontal split" },
	{ key: "I", action: "Background-open file in a new horizontal split" },
	{ key: "t", action: "Open file in a new tab" },
	{ key: "T", action: "Background-open file in a new tab" },
	{ key: "w", action: "Open file in a new window" },
	{ key: "o", action: "Toggle file preview" },
	{ key: "n", action: "Create note in current folder" },
	{ key: "N", action: "Create note in parent folder" },
	{ key: "f", action: "Create folder in current folder" },
	{ key: "F", action: "Create folder in parent folder" },
	{ key: "r", action: "Rename node" },
	{ key: "c", action: "Clone node" },
	{ key: "D", action: "Delete(Trash) focused node, or selected nodes" },
	{ key: "/", action: "Search in focused folder" },
];

export class FileExplorerKeysMapper extends KeysMapper {
	private actions: FileExplorerActions;

	constructor(app: App, settings: PluginSettings) {
		super(app);
		this.actions = new FileExplorerActions(app, settings);
	}

	protected get view(): FileExplorerView {
		return this.app.workspace.getActiveViewOfType(View) as FileExplorerView;
	}

	public async handleKeyPress(event: KeyboardEvent): Promise<void> {
		const focusedNode = this.view.tree.focusedItem;

		// Context menu represents a separate key-mapping group.
		if (domUtils.isContextMenuOpened()) {
			if (!event.shiftKey) {
				switch (event.code) {
					case "Semicolon":
						if (focusedNode == null) {
							return;
						}

						this.actions.toggleContextMenu();
						break;
					case "KeyL":
					case "KeyH":
					case "KeyJ":
					case "KeyK": {
						const key =
							event.code === "KeyL"
								? "ArrowRight"
								: event.code === "KeyH"
									? "ArrowLeft"
									: event.code === "KeyJ"
										? "ArrowDown"
										: "ArrowUp";
						const ev = new KeyboardEvent("keydown", {
							key,
							bubbles: true,
							cancelable: true,
						});
						document.dispatchEvent(ev);
						break;
					}
					default:
				}
			}
		} else if (event.shiftKey) {
			switch (event.code) {
				case "Slash": {
					this.actions.toggleHelpModal(keysHelp);
					break;
				}
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
						await this.actions.openFileInNewSplit(focusedNode.file, {
							direction: "vertical",
							shouldFocus: false,
						});
					}
					break;
				}
				case "KeyI": {
					if (focusedNode != null && isFileNode(focusedNode)) {
						await this.actions.openFileInNewSplit(focusedNode.file, {
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
						await this.actions.openFile(focusedNode.file, focusedNode.el, {
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
						await this.actions.backgroundOpenFileInNewTab(focusedNode.file);
					}
					break;
				}
				case "KeyJ": {
					this.actions.moveFocusDown(event);

					const newFocusedNode = (this.app.workspace.getActiveViewOfType(View) as FileExplorerView)
						.tree.focusedItem;

					if (newFocusedNode != null && isFileNode(newFocusedNode)) {
						await this.actions.openFile(newFocusedNode.file, newFocusedNode.el, {
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
						await this.actions.openFile(newFocusedNode.file, newFocusedNode.el, {
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
				case "Slash": {
					if (focusedNode == null || isFileNode(focusedNode)) {
						return;
					}

					event.preventDefault(); // Prevents replacing search query with "event.code`
					await this.actions.searchInFolder(focusedNode);
					break;
				}
				case "Semicolon": {
					if (focusedNode == null) {
						return;
					}

					const targetEl =
						focusedNode.el.querySelector(".nav-folder-title, .nav-file-title") ?? undefined;
					this.actions.toggleContextMenu(targetEl);
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
						await this.actions.openFile(focusedNode.file, focusedNode.el, {
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
						await this.actions.openFileInNewSplit(focusedNode.file, {
							direction: "vertical",
							shouldFocus: true,
						});
					}
					break;
				}
				case "KeyI": {
					if (focusedNode != null && isFileNode(focusedNode)) {
						await this.actions.openFileInNewSplit(focusedNode.file, {
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
						await this.actions.openFileInNewTab(focusedNode.file);
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
