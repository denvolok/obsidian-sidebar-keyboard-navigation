import { Plugin } from "obsidian";

interface PluginSettings {
	excludedKeys: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	excludedKeys: "Dr", // TODO: this syntax might not work if needed "space" and prob some other stuff
};

interface PluginData {
	settings: PluginSettings;
}

export class FileTreeNavData extends Plugin {
	public data: PluginData;

	public async loadSettings(): Promise<void> {
		const storedData = (await this.loadData()) as PluginData;
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
