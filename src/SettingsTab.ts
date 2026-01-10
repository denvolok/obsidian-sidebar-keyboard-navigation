import { PluginSettingTab, Setting, ToggleComponent } from "obsidian";
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
					.setValue(this.plugin.data.settings.enableDuplicateOpenedFilesFiltering)
					.onChange(async (value) => {
						settings.enableDuplicateOpenedFilesFiltering = value;

						backgroundOpeningHelpSetting.setDisabled(!value);
						if (!value) {
							backgroundOpeningHelpToggle.setValue(false);
							settings.enableBackgroundOpenVisualHelp = false;
						}

						await this.plugin.saveSettings();
					}),
			);

		let backgroundOpeningHelpToggle: ToggleComponent;
		const backgroundOpeningHelpSetting = new Setting(containerEl)
			.setName("Show visual clue for background-opening")
			.setDesc(
				"When you try to background-open an already opened and visible file, there is no focus switch - so with this setting enabled, the target tab will be highlighted, so you don't get lost.",
			)
			.addToggle((toggle) => {
				backgroundOpeningHelpToggle = toggle;

				return toggle
					.setValue(this.plugin.data.settings.enableBackgroundOpenVisualHelp)
					.onChange(async (value) => {
						settings.enableBackgroundOpenVisualHelp = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
