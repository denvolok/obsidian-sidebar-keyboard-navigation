import { SettingsTab } from "./plugin-data/SettingsTab";
import { View, WorkspaceLeaf } from "obsidian";
import { PluginData } from "./plugin-data/PluginData";
import { mapCharacterToKeystroke } from "./utils/utils";
import { FileExplorerKeysMapper } from "./views/file-explorer/FileExplorerKeysMapper";
import { KeysMapper } from "./KeysMapper";
import { ViewType } from "./types";
import { SearchKeysMapper } from "./views/search/SearchKeysMapper";

export default class SidebarKeyboardNav extends PluginData {
	private keysMappers: Record<string, KeysMapper>;

	public async onload(): Promise<void> {
		await this.loadSettings();

		this.keysMappers = {
			[ViewType.FileExplorer]: new FileExplorerKeysMapper(this.app, this.data.settings),
			[ViewType.Search]: new SearchKeysMapper(this.app, this.data.settings),
		};

		this.addSettingTab(new SettingsTab(this));
		this.registerEvent(this.app.workspace.on("active-leaf-change", this.handleLeafChange));
	}

	public onunload() {
		document.removeEventListener("keydown", this.handleKeyPress);
		this.hideHelpModal();
	}

	/**
	 * Conditionally attaches/detaches "keydown" handler when a supported View is getting focused.
	 */
	private handleLeafChange = (leaf: WorkspaceLeaf | null): void => {
		if (leaf == null) {
			return;
		}

		const isSupportedView = this.keysMappers[leaf.view.getViewType()] != null;

		if (isSupportedView) {
			document.addEventListener("keydown", this.handleKeyPress);
		} else {
			// TODO: try to make this call conditional (based on Obsidian API).
			document.removeEventListener("keydown", this.handleKeyPress);
			this.hideHelpModal();
		}
	};

	private handleKeyPress = (event: KeyboardEvent): void => {
		Promise.resolve()
			.then(() => {
				const activeViewType = this.app.workspace.getActiveViewOfType(View)?.getViewType();

				if (
					activeViewType != null &&
					this.keysMappers[activeViewType] != null &&
					this.checkIsShouldHandleKeyPress(event)
				) {
					event.stopImmediatePropagation();
					return this.keysMappers[activeViewType].handleKeyPress(event);
				}

				return;
			})
			.catch(console.error);
	};

	/**
	 * Checks special cases for when we should not handle keystrokes.
	 *
	 * NOTE: the order of checks is important as we want to minimize the impact on performance,
	 * so the most generic and performant checks should come first.
	 */
	private checkIsShouldHandleKeyPress(event: KeyboardEvent): boolean {
		const isUnsupportedKeyStroke = event.ctrlKey || event.altKey || event.metaKey;

		if (isUnsupportedKeyStroke) {
			return false;
		}

		const isSomeInputFocused =
			document.activeElement != null &&
			(document.activeElement.classList.contains("is-being-renamed") ||
				document.activeElement.tagName === "INPUT" ||
				document.activeElement.getAttribute("contenteditable") === "true");

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
	}

	/**
	 * Duplicates minimal code from `toggleHelpModal` to avoid code coupling.
	 */
	private hideHelpModal(): void {
		const node = document.querySelector(".sidebar-keyboard-nav");

		if (node != null) {
			document.body.removeChild(node);
		}
	}
}
