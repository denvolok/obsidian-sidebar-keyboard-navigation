import { SearchView, View } from "obsidian";
import { CommonActions } from "../../CommonActions";

export class SearchActions extends CommonActions {
	protected get view(): SearchView {
		return this.app.workspace.getActiveViewOfType(View) as SearchView;
	}

	private get searchResultsEl(): HTMLElement {
		return this.view.dom.el;
	}

	public moveFocus(direction: "up" | "down"): void {
		const key = direction === "up" ? "ArrowUp" : "ArrowDown";
		const event = new KeyboardEvent("keydown", {
			key,
			bubbles: true,
			cancelable: true,
		});

		const isMovingOutside =
			direction === "up" && this.view.dom.focusedItem?.el === this.view.dom.vChildren.first().el;

		if (isMovingOutside) {
			return;
		}

		this.searchResultsEl.dispatchEvent(event);
	}

	public focusFirstRootNode() {
		this.view.dom.setFocusedItem(this.view.dom.vChildren.first());
	}

	public focusLastRootNode() {
		this.view.dom.setFocusedItem(this.view.dom.vChildren.last());
	}

	public setCollapseFileResults(isCollapsed: boolean): void {
		const key = isCollapsed ? "ArrowLeft" : "ArrowRight";
		const event = new KeyboardEvent("keydown", {
			key,
			bubbles: true,
			cancelable: true,
		});

		this.searchResultsEl.dispatchEvent(event);
	}

	public toggleCollapseAllResults(): void {
		this.view.collapseResultsToggle.onClick();
	}
}
