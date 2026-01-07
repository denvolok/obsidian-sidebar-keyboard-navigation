import { Plugin } from "obsidian";

interface PluginSettings {
	excludedKeys: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	excludedKeys: "Dr", // TODO: this syntax might not work if needed "space" and prob some other stuff
};

interface PluginStoredData {
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
