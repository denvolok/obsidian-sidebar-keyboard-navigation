import { Plugin } from "obsidian";

export interface PluginSettings {
	excludedKeys: string;
	enableDuplicateOpenedFilesFiltering: boolean;
	enableBackgroundOpenVisualHelp: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
	excludedKeys: "Dr",
	enableDuplicateOpenedFilesFiltering: false,
	enableBackgroundOpenVisualHelp: true,
};

export interface PluginStoredData {
	settings: PluginSettings;
}

export class PluginData extends Plugin {
	public data: PluginStoredData;

	public async loadSettings(): Promise<void> {
		const storedData = (await this.loadData()) as PluginStoredData;
		this.data = {
			...storedData,
			settings: {
				...DEFAULT_SETTINGS,
				...storedData.settings,
			},
		};
	}

	public async saveSettings(): Promise<void> {
		await this.saveData(this.data);
	}
}
