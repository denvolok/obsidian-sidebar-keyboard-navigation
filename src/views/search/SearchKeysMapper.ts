import { KeysMapper } from "../../KeysMapper";
import { App, SearchView, View } from "obsidian";
import { PluginSettings } from "../../plugin-data/PluginData";
import { domUtils } from "../../utils/utils";
import { SearchActions } from "./SearchActions";

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
					default:
				}
			}
		} else if (event.shiftKey) {
			switch (event.code) {
				case "Slash": {
					this.actions.toggleHelpModal(keysHelp);
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
					const targetEl = focusedNode.selfEl ?? focusedNode.el;
					this.actions.toggleContextMenu(targetEl);
					break;
				}
				case "KeyJ": {
					this.actions.moveFocusDown();
					break;
				}
				case "KeyK": {
					this.actions.moveFocusUp();
					break;
				}
				default:
			}
		}
	}
}

const keysHelp = [
	{ key: "?", action: "Toggle this help menu" },
	{ key: "j", action: "Move down" },
	{ key: "k", action: "Move up" },
	{ key: ";", action: "Toggle context menu" },
];
