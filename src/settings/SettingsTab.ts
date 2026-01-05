import { PluginSettingTab, Setting } from "obsidian";
import FileTreeNav from "../main";
import { validCharsRegex } from "../utils/utils";

export class SettingsTab extends PluginSettingTab {
	private plugin: FileTreeNav;

	constructor(plugin: FileTreeNav) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	public display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Excluded keys")
			.setDesc("List of keys to ignore. Only use keys mentioned in the docs. Case-sensitive.")
			.addText((text) =>
				text
					// eslint-disable-next-line obsidianmd/ui/sentence-case
					.setPlaceholder("Example: Zl;")
					.setValue(this.plugin.settings.excludedKeys)
					.onChange(async (value) => {
						const isInvalidValue = value.match(validCharsRegex) == null;
						const isDuplicateEntries = value
							.split("")
							.some((char, i, arr) => arr.indexOf(char) !== i);

						if (isInvalidValue || isDuplicateEntries) {
							text.setValue(this.plugin.settings.excludedKeys);
							return;
						}

						this.plugin.settings.excludedKeys = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
