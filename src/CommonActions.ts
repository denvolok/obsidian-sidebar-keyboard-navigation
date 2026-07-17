import {
	App,
	FileView,
	MarkdownView,
	SplitDirection,
	TFile,
	View,
	WorkspaceLeaf,
	WorkspaceTabs,
} from "obsidian";
import { domUtils } from "./utils/utils";
import { PluginSettings } from "./plugin-data/PluginData";

export abstract class CommonActions {
	protected abstract get view(): View;

	constructor(
		protected app: App,
		protected settings: PluginSettings,
	) {}

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

	public async openFile(
		file: TFile,
		el: HTMLElement,
		options: {
			shouldFocus: boolean;
			shouldPreventDuplicate: boolean;
		},
	): Promise<void> {
		if (options.shouldPreventDuplicate && this.settings.enableDuplicateOpenedFilesFiltering) {
			const isFileAlreadyOpened = this.tryToFindAndRevealFile(file, {
				shouldFocus: options.shouldFocus,
			});

			if (isFileAlreadyOpened) {
				return;
			}
		}

		if (options.shouldFocus) {
			const event = new KeyboardEvent("keydown", {
				key: "Enter",
				bubbles: true,
				cancelable: true,
			});
			el.dispatchEvent(event);
			return;
		} else {
			const recentLeaf = this.app.workspace.getMostRecentLeaf();
			if (recentLeaf != null) {
				await recentLeaf.openFile(file);
			}
		}
	}

	public async openFileInNewTab(file: TFile) {
		if (this.settings.enableDuplicateOpenedFilesFiltering) {
			const isFileAlreadyOpened = this.tryToFindAndRevealFile(file, {
				shouldFocus: false,
			});

			if (isFileAlreadyOpened) {
				return;
			}
		}

		const newLeaf = this.app.workspace.getLeaf("tab");
		await newLeaf.openFile(file);
		// NOTE: calling `setActiveLeaf` is needed only for the case when current editor tab is empty, for other cases `getLeaf` is sufficient.
		this.app.workspace.setActiveLeaf(newLeaf, { focus: true });
	}

	/**
	 * NOTE: this action uses a modified version of the `createLeafInTabGroup`(internal) function,
	 * so it more likely to introduce bugs after Obsidian updates related logic.
	 */
	public async backgroundOpenFileInNewTab(file: TFile) {
		if (this.settings.enableDuplicateOpenedFilesFiltering) {
			const isFileAlreadyOpened = this.tryToFindAndRevealFile(file, {
				shouldFocus: false,
			});

			if (isFileAlreadyOpened) {
				return;
			}
		}

		const recentLeaf = this.app.workspace.getMostRecentLeaf();
		if (recentLeaf == null) {
			throw new Error("No tab group found");
		}
		const tabs = recentLeaf.parent;
		if (!(tabs instanceof WorkspaceTabs)) {
			return;
		}
		const rightmostTab = tabs.children.last();
		if (rightmostTab == null) {
			return;
		}

		const isRightmostTabEmpty = !(rightmostTab.view instanceof FileView);
		let targetLeaf: WorkspaceLeaf;

		if (isRightmostTabEmpty) {
			targetLeaf = recentLeaf;
		} else {
			// @ts-ignore // incorrect constructor parameters typings in the "obsidian" package
			targetLeaf = new WorkspaceLeaf(this.app);
			tabs.insertChild(tabs.children.length, targetLeaf);
		}

		await targetLeaf.openFile(file);
	}

	public async openFileInNewSplit(
		file: TFile,
		options: {
			direction: SplitDirection;
			shouldFocus: boolean;
		},
	): Promise<void> {
		if (this.settings.enableDuplicateOpenedFilesFiltering) {
			const isFileAlreadyOpened = this.tryToFindAndRevealFile(file, {
				shouldFocus: options.shouldFocus,
			});

			if (isFileAlreadyOpened) {
				return;
			}
		}

		let newLeaf: WorkspaceLeaf;

		if (options.shouldFocus) {
			newLeaf = this.app.workspace.getLeaf("split", options.direction);
		} else {
			const recentLeaf = this.app.workspace.getMostRecentLeaf();

			if (recentLeaf == null) {
				return;
			}

			// @ts-ignore // incorrect constructor parameters typings in the "obsidian" package
			newLeaf = new WorkspaceLeaf(this.app);
			this.app.workspace.splitLeaf(recentLeaf, newLeaf, options.direction);
		}

		await newLeaf.openFile(file);
	}

	/**
	 * Checks whether `file` is opened, reveals leaf(makes tab visible) and optionally focuses tab.
	 * @returns {boolean} - Is file found and revealed.
	 */
	private tryToFindAndRevealFile(file: TFile, options: { shouldFocus: boolean }): boolean {
		const leaf = this.findLeafByFile(file);

		if (leaf == null) {
			return false;
		}

		if (options.shouldFocus) {
			this.app.workspace.setActiveLeaf(leaf);
		} else if (leaf.parent instanceof WorkspaceTabs) {
			leaf.parent.selectTab(leaf);

			const targetFileIdx = leaf.parent.children.findIndex((children) => children === leaf);
			const isRevealingCurrentlyVisibleTab = leaf.parent.currentTab === targetFileIdx;

			if (isRevealingCurrentlyVisibleTab && this.settings.enableBackgroundOpenVisualHelp) {
				leaf.tabHeaderEl.addClass("sidebar-keyboard-nav-focused-tab");

				setTimeout(() => {
					leaf.tabHeaderEl.removeClass("sidebar-keyboard-nav-focused-tab");
				}, 300);
			}
		}

		return true;
	}

	private findLeafByFile(file: TFile): WorkspaceLeaf | null {
		const leaves = this.app.workspace.getLeavesOfType("markdown");

		for (const leaf of leaves) {
			if (leaf.view instanceof MarkdownView && leaf.view.file === file) {
				return leaf;
			}
		}

		return null;
	}
}
