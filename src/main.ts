import { SettingsTab } from "./settings/SettingsTab";
import { App, FileExplorer, PluginManifest, View } from "obsidian";
import { FileTreeNavSettings } from "./settings/FileTreeNavSettings";
import { Actions } from "./Actions";
import { mapCharacterToKeystroke } from "./utils/utils";

export default class FileTreeNav extends FileTreeNavSettings {
	private actions: Actions;

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

		const isKeyDisabledInSettings = this.settings.excludedKeys.split("").some((char) => {
			const keystroke = mapCharacterToKeystroke(char);
			return keystroke.code === event.code && keystroke.shiftKey === event.shiftKey;
		});

		return !isKeyDisabledInSettings;
	};

	private handleKeyPress = async (event: KeyboardEvent): Promise<void> => {
		// console.log(event)
		if (event.shiftKey) {
			switch (event.code) {
				case "KeyZ": {
					this.actions.collapseAllFolders();
					break;
				}
				case "KeyN": {
					this.actions.createNewItem("folder");
					break;
				}
				default:
			}
		} else {
			switch (event.code) {
				// case "ContextMenu": // TODO: not sure if needed
				case "Semicolon": {
					event.preventDefault(); // NOTE: by default, it toggles the frame context menu.
					this.actions.toggleContextMenu();
					break;
				}
				case "KeyJ": {
					this.actions.onKeyArrowDown(event);
					break;
				}
				case "KeyK": {
					this.actions.onKeyArrowUp(event);
					break;
				}
				case "KeyH": {
					const fileExplorer = this.app.workspace.getActiveViewOfType(View) as FileExplorer;
					fileExplorer.tree.onKeyArrowLeft(event);
					break;
				}
				case "KeyL": {
					const fileExplorer = this.app.workspace.getActiveViewOfType(View) as FileExplorer;
					fileExplorer.tree.onKeyArrowRight(event);
					break;
				}
				case "KeyS": {
					await this.actions.openInNewSplit("vertical");
					break;
				}
				case "KeyI": {
					await this.actions.openInNewSplit("horizontal");
					break;
				}
				case "KeyN": {
					this.actions.createNewItem("file");
					break;
				}
				case "KeyC": {
					await this.actions.cloneFile();
					break;
				}
				default:
			}
		}
	};
}
