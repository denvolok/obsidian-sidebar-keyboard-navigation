import { View } from "obsidian";
import { domUtils } from "./utils/utils";
import { PluginSettings } from "./plugin-data/PluginData";

export abstract class CommonActions {
	protected abstract get view(): View;

	protected constructor(protected settings: PluginSettings) {}

	/**
	 * Builds and shows/hides HTML <table> which displays key bindings cheatsheet.
	 */
	public toggleHelpModal(keysHelp: { key: string; action: string }[]): void {
		const modalNode = document.querySelector(".sidebar-keyboard-nav");

		if (modalNode != null) {
			document.body.removeChild(modalNode);
		} else {
			const { left, top, width, height } = this.view.containerEl.getBoundingClientRect();

			const elContainer = document.createElement("div");
			elContainer.classList.add("sidebar-keyboard-nav");
			elContainer.style = `left: ${left + 5}px; top: ${top + 5}px; width: ${width - 10}px; max-height: ${height - 10}px`;

			const elTitle = document.createElement("div");
			elTitle.textContent = "Sidebar keyboard navigation - help";
			elTitle.classList.add("sidebar-keyboard-nav__title");

			const elCloseHelp = document.createElement("div");
			elCloseHelp.textContent = `Press "?" to close`;
			elCloseHelp.classList.add("sidebar-keyboard-nav__close-help");

			elContainer.appendChild(elTitle);
			elContainer.appendChild(elCloseHelp);

			const elTable = document.createElement("table");

			elContainer.appendChild(elTable);

			const elThead = document.createElement("thead");
			const elTbody = document.createElement("tbody");

			elTable.append(elThead, elTbody);

			const th1 = document.createElement("th");
			const th2 = document.createElement("th");
			th1.textContent = "Key";
			th2.textContent = "Action";

			elThead.append(th1, th2);

			const enabledKeys: (typeof keysHelp)[0][] = [];
			const disabledKeys: (typeof keysHelp)[0][] = [];

			keysHelp.forEach((keyHelp) => {
				const isDisabledKey = this.settings.excludedKeys.includes(keyHelp.key);

				if (isDisabledKey) {
					disabledKeys.push(keyHelp);
				} else {
					enabledKeys.push(keyHelp);
				}
			});

			if (enabledKeys.length > 0) {
				enabledKeys.forEach((keyHelp) => {
					const row = document.createElement("tr");
					const td1 = document.createElement("td");
					const td2 = document.createElement("td");

					td1.textContent = keyHelp.key;
					td2.textContent = keyHelp.action;

					row.append(td1, td2);
					elTbody.appendChild(row);
				});
			}

			if (disabledKeys.length > 0) {
				const rowTitle = document.createElement("tr");
				const tdTitle = document.createElement("td");

				tdTitle.colSpan = 2;
				tdTitle.classList.add("sidebar-keyboard-nav-disabled-settings-td");
				tdTitle.textContent = "Keys disabled in settings";

				rowTitle.appendChild(tdTitle);
				elTbody.appendChild(rowTitle);

				disabledKeys.forEach((keyHelp) => {
					const row = document.createElement("tr");
					const td1 = document.createElement("td");
					const td2 = document.createElement("td");

					td1.textContent = keyHelp.key;
					td2.textContent = keyHelp.action;

					row.append(td1, td2);
					elTbody.appendChild(row);
				});
			}

			document.body.appendChild(elContainer);
		}
	}

	public toggleContextMenu(targetEl?: Element): void {
		if (domUtils.isContextMenuOpened()) {
			const hideEvent = new KeyboardEvent("keydown", {
				key: "Escape",
				bubbles: true,
				cancelable: true,
			});
			document.dispatchEvent(hideEvent);
		} else {
			if (targetEl == null) {
				throw new Error("Target element for context menu not available.");
			}

			const contextmenuEvent = new MouseEvent("contextmenu", {
				bubbles: true,
				cancelable: true,
				view: window,
				clientX: targetEl.getBoundingClientRect().left,
				clientY: targetEl.getBoundingClientRect().top,
			});

			targetEl.dispatchEvent(contextmenuEvent);
		}
	}
}
