import { App, View } from "obsidian";

export abstract class KeysMapper {
	protected app: App;

	protected constructor(app: App) {
		this.app = app;
	}

	public abstract handleKeyPress(event: KeyboardEvent): Promise<void>;

	/**
	 * Main `View` of the current tool window.
	 */
	protected abstract get view(): View;
}
