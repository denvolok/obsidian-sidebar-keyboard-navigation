import { KeysMapper } from "../../KeysMapper";
import { App, SearchView, View } from "obsidian";
import { PluginSettings } from "../../plugin-data/PluginData";
import { domUtils } from "../../utils/utils";
import { SearchActions } from "./SearchActions";
import { isFileNode } from "./search-utils";

const keysHelp = [
	{ key: "?", action: "Toggle this help menu" },
	{ key: "j", action: "Move down" },
	{ key: "J", action: "Move down and preview search match" },
	{ key: "k", action: "Move up" },
	{ key: "K", action: "Move up and preview search match" },
	{ key: "g", action: "Focus the topmost root node" },
	{ key: "G", action: "Focus the bottommost root node" },
	{ key: ";", action: "Toggle context menu" },
	{ key: "h", action: "Collapse file results" },
	{ key: "H", action: "Collapse file results" },
	{ key: "l", action: "Expand file results, or open file" },
	{ key: "L", action: "Expand file results, or open file in background" },
	{ key: "Z", action: "Collapse/Expand results" },
	{ key: "s", action: "Open file in a new vertical split" },
	{ key: "S", action: "Background-open file in a new vertical split" },
	{ key: "i", action: "Open file in a new horizontal split" },
	{ key: "I", action: "Background-open file in a new horizontal split" },
	{ key: "t", action: "Open file in a new tab" },
	{ key: "T", action: "Background-open file in a new tab" },
];

export class SearchKeysMapper extends KeysMapper {
	private actions: SearchActions;

	constructor(app: App, settings: PluginSettings) {
		super(app);
		this.actions = new SearchActions(app, settings);
	}

	protected get view(): SearchView {
		return this.app.workspace.getActiveViewOfType(View) as SearchView;
	}

	async handleKeyPress(event: KeyboardEvent): Promise<void> {
		const focusedNode = this.view.dom.focusedItem;

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
				case "KeyG": {
					this.actions.focusLastRootNode();
					break;
				}
				case "KeyZ": {
					this.actions.toggleCollapseAllResults();
					break;
				}
				case "KeyL": {
					if (focusedNode == null) {
						return;
					}

					if (isFileNode(focusedNode)) {
						this.actions.setCollapseFileResults(false);
					} else {
						await this.actions.openFile(focusedNode.parent.file, focusedNode.el, {
							shouldFocus: false,
							shouldPreventDuplicate: false,
							eState: {
								match: {
									content: focusedNode.content,
									matches: focusedNode.matches,
								},
							},
						});
					}
					break;
				}
				case "KeyS": {
					if (focusedNode == null) {
						return;
					}

					const file = isFileNode(focusedNode) ? focusedNode.file : focusedNode.parent.file;
					await this.actions.openFileInNewSplit(file, {
						direction: "vertical",
						shouldFocus: false,
					});
					break;
				}
				case "KeyI": {
					if (focusedNode == null) {
						return;
					}

					const file = isFileNode(focusedNode) ? focusedNode.file : focusedNode.parent.file;
					await this.actions.openFileInNewSplit(file, {
						direction: "horizontal",
						shouldFocus: false,
					});
					break;
				}
				case "KeyT": {
					if (focusedNode == null) {
						return;
					}

					const file = isFileNode(focusedNode) ? focusedNode.file : focusedNode.parent.file;
					await this.actions.backgroundOpenFileInNewTab(file);
					break;
				}
				case "KeyJ":
				case "KeyK": {
					const direction = event.code === "KeyJ" ? "down" : "up";
					this.actions.moveFocus(direction);

					const newFocusedNode = this.view.dom.focusedItem;

					if (newFocusedNode != null && !isFileNode(newFocusedNode)) {
						await this.actions.openFile(newFocusedNode.parent.file, newFocusedNode.el, {
							shouldFocus: false,
							shouldPreventDuplicate: false,
							eState: {
								match: {
									content: newFocusedNode.content,
									matches: newFocusedNode.matches,
								},
							},
						});
					}
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
					const targetEl = isFileNode(focusedNode) ? focusedNode.selfEl : focusedNode.el;
					this.actions.toggleContextMenu(targetEl);
					break;
				}
				case "KeyJ": {
					this.actions.moveFocus("down");
					break;
				}
				case "KeyK": {
					this.actions.moveFocus("up");
					break;
				}
				case "KeyG": {
					this.actions.focusFirstRootNode();
					break;
				}
				case "KeyH": {
					if (focusedNode == null) {
						return;
					}
					this.actions.setCollapseFileResults(true);
					break;
				}
				case "KeyL": {
					if (focusedNode == null) {
						return;
					}

					if (isFileNode(focusedNode)) {
						this.actions.setCollapseFileResults(false);
					} else {
						await this.actions.openFile(focusedNode.parent.file, focusedNode.el, {
							shouldFocus: true,
							shouldPreventDuplicate: true,
						});
					}
					break;
				}
				case "KeyS": {
					if (focusedNode == null) {
						return;
					}

					const file = isFileNode(focusedNode) ? focusedNode.file : focusedNode.parent.file;
					await this.actions.openFileInNewSplit(file, {
						direction: "vertical",
						shouldFocus: true,
					});
					break;
				}
				case "KeyI": {
					if (focusedNode == null) {
						return;
					}

					const file = isFileNode(focusedNode) ? focusedNode.file : focusedNode.parent.file;
					await this.actions.openFileInNewSplit(file, {
						direction: "horizontal",
						shouldFocus: true,
					});
					break;
				}
				case "KeyT": {
					if (focusedNode == null) {
						return;
					}

					const file = isFileNode(focusedNode) ? focusedNode.file : focusedNode.parent.file;
					await this.actions.openFileInNewTab(file);
					break;
				}
				default:
			}
		}
	}
}
