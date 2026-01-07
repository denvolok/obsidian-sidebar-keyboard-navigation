import { SettingsTab } from "./plugin-data/SettingsTab";
import { App, FileExplorer, PluginManifest, View } from "obsidian";
import { PluginData } from "./plugin-data/PluginData";
import { Actions } from "./Actions";
import { mapCharacterToKeystroke } from "./utils/utils";

export default class FileTreeNav extends PluginData {
	private actions: Actions;

	private get fileExplorer(): FileExplorer {
		return this.app.workspace.getActiveViewOfType(View) as FileExplorer;
	}

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.actions = new Actions(app);
	}

	public async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this));
		this.registerDomEvent(document, "keydown", this.handleKeyPressIfNeeded);
	}

	/**
	 * NOTE: the event handler will be detached by `registerDomEvent`.
	 */
	public onunload() {}

	private handleKeyPressIfNeeded = async (event: KeyboardEvent): Promise<void> => {
		if (this.shouldHandleKeyPress(event)) {
			event.stopImmediatePropagation();
			this.handleKeyPress(event).catch(console.error); // TODO: should handle errors?
		}
	};

	/**
	 * NOTE: the order of checks matters as we want to minimize the impact on performance,
	 * so the most generic and performant checks should come first.
	 */
	private shouldHandleKeyPress = (event: KeyboardEvent): boolean => {
		const isUnsupportedKeyStroke = event.ctrlKey || event.altKey || event.metaKey;

		if (isUnsupportedKeyStroke) {
			return false;
		}

		const isFileExplorerFocused =
			this.app.workspace.getActiveViewOfType(View)?.getViewType() === "file-explorer";

		if (!isFileExplorerFocused) {
			return false;
		}

		const isSomeInputFocused =
			document.activeElement?.classList.contains("is-being-renamed") ||
			document.activeElement?.tagName === "INPUT" ||
			document.activeElement?.getAttribute("contenteditable") === "true";

		if (isSomeInputFocused) {
			return false;
		}

		const isSomePopupOpen = Boolean(document.querySelector(".modal"));

		if (isSomePopupOpen) {
			return false;
		}

		const isKeyDisabledInSettings = this.data.settings.excludedKeys.split("").some((char) => {
			const keystroke = mapCharacterToKeystroke(char);
			return keystroke.code === event.code && keystroke.shiftKey === event.shiftKey;
		});

		return !isKeyDisabledInSettings;
	};

	private handleKeyPress = async (event: KeyboardEvent): Promise<void> => {
		if (event.shiftKey) {
			switch (event.code) {
				case "KeyZ": {
					this.actions.collapseAllFolders();
					break;
				}
				case "KeyN": {
					this.actions.createNewEntry("folder");
					break;
				}
				case "KeyD": {
					this.actions.deleteEntryAndFocusNext();
					break;
				}
				case "KeyS": {
					await this.actions.openFocusedEntryInNewSplit({
						direction: "vertical",
						shouldFocus: false,
					});
					break;
				}
				case "KeyI": {
					await this.actions.openFocusedEntryInNewSplit({
						direction: "horizontal",
						shouldFocus: false,
					});
					break;
				}
				case "KeyL": {
					await this.actions.openFileWithoutFocusOrExpandFolder();
					break;
				}
				case "KeyH": {
					this.actions.focusParentOrCollapseRecursively();
					break;
				}
				case "KeyG": {
					this.fileExplorer.tree.setFocusedItem(
						this.fileExplorer.tree.root.vChildren.children.slice(-1)[0],
					);
					break;
				}
				case "KeyT": {
					await this.actions.openFileInNewTabWithoutFocus();
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
				case "KeyV": {
					this.fileExplorer.tree.clearSelectedDoms();
					break;
				}
				default:
			}
		} else {
			switch (event.code) {
				case "Semicolon": {
					this.actions.toggleContextMenu();
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
					this.fileExplorer.tree.onKeyArrowLeft(event);
					break;
				}
				case "KeyL": {
					this.fileExplorer.tree.onKeyArrowRight(event);
					break;
				}
				case "KeyS": {
					await this.actions.openFocusedEntryInNewSplit({
						direction: "vertical",
						shouldFocus: true,
					});
					break;
				}
				case "KeyI": {
					await this.actions.openFocusedEntryInNewSplit({
						direction: "horizontal",
						shouldFocus: true,
					});
					break;
				}
				case "KeyN": {
					this.actions.createNewEntry("file");
					break;
				}
				case "KeyC": {
					await this.actions.cloneEntry();
					break;
				}
				case "KeyR": {
					this.fileExplorer.onKeyRename(event);
					break;
				}
				case "KeyG": {
					this.fileExplorer.tree.setFocusedItem(this.fileExplorer.tree.root.vChildren.children[0]);
					break;
				}
				case "KeyT": {
					await this.actions.openFileInNewTabAndFocus();
					break;
				}
				case "KeyV": {
					this.actions.toggleItemSelection();
					break;
				}
				case "KeyW": {
					await this.actions.openFileInNewWindow();
					break;
				}
				default:
			}
		}
	};
}
