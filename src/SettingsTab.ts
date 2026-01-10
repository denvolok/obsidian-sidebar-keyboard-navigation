import { PluginSettingTab, Setting } from "obsidian";
import FileExplorerKeyboardNav from "./main";

export class SettingsTab extends PluginSettingTab {
	private plugin: FileExplorerKeyboardNav;

	constructor(plugin: FileExplorerKeyboardNav) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	public display(): void {
		const { containerEl } = this;
		const { settings } = this.plugin.data;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Excluded keys")
			.setDesc(
				"List of keys to ignore. Only the keys mentioned in the docs allowed. Case-sensitive.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Example: s;")
					.setValue(settings.excludedKeys)
					.onChange(async (value) => {
						const isInvalidValue = value.match(/^[jJkKgGvVhHlLZsSiItTwonNfFrcD;?]*$/) == null; // TODO: no linking with the actions.
						const isDuplicateEntries = value
							.split("")
							.some((char, i, arr) => arr.indexOf(char) !== i);

						if (isInvalidValue || isDuplicateEntries) {
							text.setValue(settings.excludedKeys);
							return;
						}

						settings.excludedKeys = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Prevent opening duplicate files")
			.setDesc(
				"If enabled, trying to open an already opened file will switch to it instead (or, if a background-opening action used, focus the tab without switching to it).",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.data.settings.doNotDuplicateOpenedFiles)
					.onChange(async (value) => {
						settings.doNotDuplicateOpenedFiles = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
