import { FileExplorerActions } from "./FileExplorerActions";
import { PluginSettings } from "./plugin-data/PluginData";
import { App, FileExplorerView, View } from "obsidian";

import { isFileNode, KeysMapper } from "./types";

export class FileExplorerKeysMapper implements KeysMapper {
	private app: App;
	private settings: PluginSettings;
	private actions: FileExplorerActions;

	private get fileExplorer(): FileExplorerView {
		return this.app.workspace.getActiveViewOfType(View) as FileExplorerView;
	}

	constructor(app: App, settings: PluginSettings) {
		this.app = app;
		this.settings = settings;
		this.actions = new FileExplorerActions(settings, app);
	}

	public async handleKeyPress(event: KeyboardEvent): Promise<void> {
		const focusedNode = (this.app.workspace.getActiveViewOfType(View) as FileExplorerView).tree
			.focusedItem;

		if (event.shiftKey) {
			switch (event.code) {
				case "Slash": {
					this.toggleHelpModal();
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

	public toggleHelpModal(): void {
		const modalNode = document.querySelector(".sidebar-keyboard-nav");

		if (modalNode != null) {
			document.body.removeChild(modalNode);
		} else {
			const { left, top, width, height } = this.fileExplorer.containerEl.getBoundingClientRect();

			const elContainer = document.createElement("div");
			elContainer.classList.add("sidebar-keyboard-nav");
			elContainer.style = `left: ${left + 5}px; top: ${top + 5}px; width: ${width - 10}px; max-height: ${height - 10}px`;

			const elTitle = document.createElement("div");
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			elTitle.textContent = "Sidebar Keyboard Navigation - Help";
			elTitle.classList.add("sidebar-keyboard-nav__title");

			const elCloseHelp = document.createElement("div");
			elCloseHelp.textContent = `Press "?" to close`;
			elCloseHelp.classList.add("sidebar-keyboard-nav__close-help");

			elContainer.appendChild(elTitle);
			elContainer.appendChild(elCloseHelp);

			const elTable = document.createElement("table");

			elContainer.appendChild(elTable);

			const elThead = document.createElement("thead");
			const elTbody = document.createElement("tbody");

			elTable.append(elThead, elTbody);

			const th1 = document.createElement("th");
			const th2 = document.createElement("th");
			th1.textContent = "Key";
			th2.textContent = "Action";

			elThead.append(th1, th2);

			const enabledKeys: (typeof keysHelp)[0][] = [];
			const disabledKeys: (typeof keysHelp)[0][] = [];

			keysHelp.forEach((keyHelp) => {
				const isDisabledKey = this.settings.excludedKeys.includes(keyHelp.key);

				if (isDisabledKey) {
					disabledKeys.push(keyHelp);
				} else {
					enabledKeys.push(keyHelp);
				}
			});

			if (enabledKeys.length > 0) {
				enabledKeys.forEach((keyHelp) => {
					const row = document.createElement("tr");
					const td1 = document.createElement("td");
					const td2 = document.createElement("td");

					td1.textContent = keyHelp.key;
					td2.textContent = keyHelp.action;

					row.append(td1, td2);
					elTbody.appendChild(row);
				});
			}

			if (disabledKeys.length > 0) {
				const rowTitle = document.createElement("tr");
				const tdTitle = document.createElement("td");

				tdTitle.colSpan = 2;
				tdTitle.classList.add("sidebar-keyboard-nav-disabled-settings-td");
				tdTitle.textContent = "Keys disabled in settings";

				rowTitle.appendChild(tdTitle);
				elTbody.appendChild(rowTitle);

				disabledKeys.forEach((keyHelp) => {
					const row = document.createElement("tr");
					const td1 = document.createElement("td");
					const td2 = document.createElement("td");

					td1.textContent = keyHelp.key;
					td2.textContent = keyHelp.action;

					row.append(td1, td2);
					elTbody.appendChild(row);
				});
			}

			document.body.appendChild(elContainer);
		}
	}
}

const keysHelp = [
	{ key: "?", action: "Toggle this help menu" },
	{ key: "j", action: "Move down" },
	{ key: "k", action: "Move up" },
	{ key: "J", action: "Move down and preview file" },
	{ key: "k", action: "Move up and preview file" },
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
	{ key: "D", action: "Delete focused node, or selected nodes" },
];
