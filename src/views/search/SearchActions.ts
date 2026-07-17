import { PluginSettings } from "../../plugin-data/PluginData";
import { App, SearchView, View } from "obsidian";
import { CommonActions } from "../../CommonActions";

export class SearchActions extends CommonActions {
	constructor(
		private app: App,
		settings: PluginSettings,
	) {
		super(settings);
	}

	protected get view(): SearchView {
		return this.app.workspace.getActiveViewOfType(View) as SearchView;
	}

	public moveFocusDown(): void {
		const event = new KeyboardEvent("keydown", {
			key: "ArrowDown",
			bubbles: true,
			cancelable: true,
		});
		this.view.dom.el.dispatchEvent(event);
	}

	public moveFocusUp(): void {
		const event = new KeyboardEvent("keydown", {
			key: "ArrowUp",
			bubbles: true,
			cancelable: true,
		});
		this.view.dom.el.dispatchEvent(event);
	}
}
