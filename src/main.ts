import { SettingsTab } from "./plugin-data/SettingsTab";
import { App, PluginManifest, View, WorkspaceLeaf } from "obsidian";
import { PluginData } from "./plugin-data/PluginData";
import { mapCharacterToKeystroke } from "./utils/utils";
import { FileExplorerKeysMapper } from "./FileExplorerKeysMapper";
import { KeysMapper, ViewType } from "types";

export default class FileExplorerKeyboardNav extends PluginData {
	private keysMappers: { [key: string]: KeysMapper };

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
	}

	public async onload(): Promise<void> {
		await this.loadSettings();

		this.keysMappers = {
			[ViewType.FileExplorer]: new FileExplorerKeysMapper(this.app, this.data.settings),
		};

		this.addSettingTab(new SettingsTab(this));
		this.registerEvent(this.app.workspace.on("active-leaf-change", this.handleLeafChange));
	}

	public onunload() {
		document.removeEventListener("keydown", this.handleKeyPress);
		this.hideHelpModal();
	}

	/**
	 * Dynamically attach "keydown" event only when a supported View is focused.
	 * This approach should provide better isolation, comparing to `registerDomEvent("keydown")`.
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
	 * NOTE: the order of checks is important as we want to minimize the impact on performance,
	 * so the most generic and performant checks should come first.
	 */
	private checkIsShouldHandleKeyPress(event: KeyboardEvent): boolean {
		const isUnsupportedKeyStroke = event.ctrlKey || event.altKey || event.metaKey;

		if (isUnsupportedKeyStroke) {
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
	}

	private hideHelpModal(): void {
		const node = document.querySelector(".sidebar-keyboard-nav");

		if (node != null) {
			document.body.removeChild(node);
		}
	}
}
