import { Plugin } from "obsidian";

interface Settings {
	excludedKeys: string;
}

const DEFAULT_SETTINGS: Settings = {
	excludedKeys: "D",
};

export class FileTreeNavSettings extends Plugin {
	public settings: Settings;

	public async loadSettings(): Promise<void> {
		const storedSettings = (await this.loadData()) as Settings;
		this.settings = {
			...DEFAULT_SETTINGS,
			...storedSettings,
		};
	}

	public async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
