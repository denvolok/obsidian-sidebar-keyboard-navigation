import {
	App,
	FileExplorerView,
	FileView,
	MarkdownView,
	SplitDirection,
	TFile,
	TFolder,
	View,
	WorkspaceLeaf,
	WorkspaceTabs,
} from "obsidian";
import { removeExtensionFromPath } from "./utils/utils";
import { isFileNode, ViewType } from "./types";
import {
	FileExplorerFileNode,
	FileExplorerFolderNode,
	FileExplorerNode,
} from "./types/obsidian-internals";
import { PluginSettings } from "./plugin-data/PluginData";

/**
 * Actions available in File Explorer.
 *
 * public functions - actions, private - utils.
 * For the sake of simplicity, all actions are grouped in a single class
 * (to avoid the burden of dependency/relation management). Should not be a
 * problem if functions kept simple and minimal.
 */
export class FileExplorerActions {
	constructor(
		private settings: PluginSettings,
		private app: App,
	) {}

	private get fileExplorer(): FileExplorerView {
		return this.app.workspace.getActiveViewOfType(View) as FileExplorerView;
	}

	private get isContextMenuOpened(): boolean {
		// NOTE: using extra selectors to avoid potential classname collisions
		return document.querySelector(".menu > .menu-scroll") != null;
	}

	private get isPreviewPopupVisible(): boolean {
		return document.querySelector(".popover.hover-popover") != null;
	}

	public collapseAllFolders(): void {
		this.fileExplorer.tree.isAllCollapsed = false;
		this.fileExplorer.tree.setCollapseAll(true);
	}

	public toggleContextMenu(focusedNode: FileExplorerNode): void {
		if (this.isContextMenuOpened) {
			const hideEvent = new KeyboardEvent("keydown", {
				key: "Escape",
				bubbles: true,
				cancelable: true,
			});
			document.dispatchEvent(hideEvent);
		} else {
			const focusedNodeTitle = focusedNode.el.querySelector(".nav-folder-title, .nav-file-title");
			if (focusedNodeTitle == null) {
				return;
			}

			const contextmenuEvent = new MouseEvent("contextmenu", {
				bubbles: true,
				cancelable: true,
				view: window,
				clientX: focusedNodeTitle.getBoundingClientRect().left,
				clientY: focusedNodeTitle.getBoundingClientRect().top,
			});

			focusedNodeTitle.dispatchEvent(contextmenuEvent);
		}
	}

	public moveFocusDown(_event: KeyboardEvent): void {
		if (this.isContextMenuOpened) {
			const event = new KeyboardEvent("keydown", {
				key: "ArrowDown",
				bubbles: true,
				cancelable: true,
			});
			document.dispatchEvent(event);
		} else {
			let event = _event;

			if (event.shiftKey) {
				// NOTE: removing "shiftKey" from the event to avoid app's native behavior to select focused item.
				event = new KeyboardEvent("keydown", {
					key: "ArrowDown",
					bubbles: true,
					cancelable: true,
				});
			}

			this.fileExplorer.tree.onKeyArrowDown(event);
		}
	}

	public moveFocusUp(_event: KeyboardEvent): void {
		if (this.isContextMenuOpened) {
			const event = new KeyboardEvent("keydown", {
				key: "ArrowUp",
				bubbles: true,
				cancelable: true,
			});
			document.dispatchEvent(event);
		} else {
			let event = _event;

			if (event.shiftKey) {
				// NOTE: removing "shiftKey" from the event to avoid app's native behavior to select focused item.
				event = new KeyboardEvent("keydown", {
					key: "ArrowUp",
					bubbles: true,
					cancelable: true,
				});
			}

			this.fileExplorer.tree.onKeyArrowUp(event);
		}
	}

	public collapseCurrentFolder(event: KeyboardEvent): void {
		this.fileExplorer.tree.onKeyArrowLeft(event);
	}

	public expandFolder(event: KeyboardEvent): void {
		this.fileExplorer.tree.onKeyArrowRight(event);
	}

	public deleteNodeAndFocusNext(focusedNode: FileExplorerNode): void {
		// NOTE: not expected case. Just type checking.
		if (focusedNode.parent == null) {
			return;
		}

		const isSingleChild = focusedNode.parent.vChildren.children.length === 1;
		let nextNodeToFocus: FileExplorerNode | null;

		if (isSingleChild) {
			// TODO: should handle case when deleting multiple items. Currently no item focused.
			const isChildOfRootNode = focusedNode.parent.parent == null;
			nextNodeToFocus = isChildOfRootNode ? null : focusedNode.parent;
		} else {
			const focusedNodeIdx = focusedNode.parent.vChildren.children.findIndex(
				(children) => children.el === focusedNode.el,
			);
			nextNodeToFocus =
				focusedNode.parent.vChildren.children[focusedNodeIdx + 1] ??
				focusedNode.parent.vChildren.children[focusedNodeIdx - 1] ??
				null;
		}

		const event = new KeyboardEvent("keydown", {
			key: "Delete",
			bubbles: true,
			cancelable: true,
		});
		document.dispatchEvent(event);

		if (nextNodeToFocus != null) {
			// NOTE: trying to reduce border flickering by delaying its rendering.
			setTimeout(() => {
				const isFileExplorerFocused =
					this.app.workspace.getActiveViewOfType(View)?.getViewType() === ViewType.FileExplorer;

				// NOTE: it's the case when after deleting a note, the focus will switch to the editor.
				if (!isFileExplorerFocused) {
					return;
				}

				this.fileExplorer.tree.setFocusedItem(nextNodeToFocus);
			}, 70);
		}
	}

	public async openFile(
		focusedNode: FileExplorerFileNode,
		event: KeyboardEvent,
		options: {
			shouldFocus: boolean;
			shouldPreventDuplicate: boolean;
		},
	): Promise<void> {
		if (options.shouldPreventDuplicate && this.settings.enableDuplicateOpenedFilesFiltering) {
			const isFileAlreadyOpened = this.tryToFindAndRevealFile(focusedNode.file, {
				shouldFocus: options.shouldFocus,
			});

			if (isFileAlreadyOpened) {
				return;
			}
		}

		if (options.shouldFocus) {
			this.fileExplorer.tree.onKeyArrowRight(event);
			return;
		} else {
			const recentLeaf = this.app.workspace.getMostRecentLeaf();
			if (recentLeaf != null) {
				await recentLeaf.openFile(focusedNode.file);
			}
		}
	}

	public async openFileInNewSplit(
		focusedNode: FileExplorerFileNode,
		options: {
			direction: SplitDirection;
			shouldFocus: boolean;
		},
	): Promise<void> {
		if (this.settings.enableDuplicateOpenedFilesFiltering) {
			const isFileAlreadyOpened = this.tryToFindAndRevealFile(focusedNode.file, {
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

		await newLeaf.openFile(focusedNode.file);
	}

	public createNewNode(
		focusedNode: FileExplorerNode,
		data: {
			nodeType: "file" | "folder";
			context: "current" | "parent";
		},
	): void {
		const { nodeType, context } = data;
		let folder: TFolder | null;

		if (context === "current") {
			folder = isFileNode(focusedNode) ? focusedNode.file.parent : focusedNode.file;
		} else {
			folder = focusedNode.file.parent;
		}

		if (folder != null) {
			this.fileExplorer.createAbstractFile(nodeType, folder, false);
		}
	}

	public async cloneNode(focusedNode: FileExplorerNode): Promise<void> {
		const destPath = this.app.vault.getAvailablePath(
			removeExtensionFromPath(focusedNode.file.path),
			isFileNode(focusedNode) ? focusedNode.file.extension : undefined,
		);
		await this.app.vault.copy(focusedNode.file, destPath);
	}

	public focusParentNode(focusedNode: FileExplorerNode): void {
		this.fileExplorer.tree.setFocusedItem(focusedNode.parent);
	}

	public focusFirstRootNode(): void {
		const firstRootNode = this.fileExplorer.tree.root.vChildren.children[0];
		this.fileExplorer.tree.setFocusedItem(firstRootNode);
	}

	public focusLastRootNode(): void {
		const lastRootNode = this.fileExplorer.tree.root.vChildren.children.slice(-1)[0];
		this.fileExplorer.tree.setFocusedItem(lastRootNode);
	}

	public recursivelySetFolderCollapsed(
		node: FileExplorerFolderNode,
		options: {
			isCollapsed: boolean;
		},
	): void {
		if (node.collapsed !== options.isCollapsed) {
			node.setCollapsed(options.isCollapsed);
		}

		if ("vChildren" in node) {
			for (const child of node.vChildren.children) {
				if (!isFileNode(child)) {
					this.recursivelySetFolderCollapsed(child, options);
				}
			}
		}
	}

	public renameNode(event: KeyboardEvent): void {
		this.fileExplorer.onKeyRename(event);
	}

	public async openFileInNewTab(focusedNode: FileExplorerFileNode) {
		if (this.settings.enableDuplicateOpenedFilesFiltering) {
			const isFileAlreadyOpened = this.tryToFindAndRevealFile(focusedNode.file, {
				shouldFocus: false,
			});

			if (isFileAlreadyOpened) {
				return;
			}
		}

		const newLeaf = this.app.workspace.getLeaf("tab");
		await newLeaf.openFile(focusedNode.file);
		// NOTE: calling `setActiveLeaf` is needed only for the case when current editor tab is empty, for other cases `getLeaf` is sufficient.
		this.app.workspace.setActiveLeaf(newLeaf, { focus: true });
	}

	/**
	 * NOTE: this action uses a modified version of the `createLeafInTabGroup`(internal) function,
	 * so it more likely to introduce bugs after Obsidian updates related logic.
	 */
	public async backgroundOpenFileInNewTab(focusedNode: FileExplorerFileNode) {
		if (this.settings.enableDuplicateOpenedFilesFiltering) {
			const isFileAlreadyOpened = this.tryToFindAndRevealFile(focusedNode.file, {
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

		await targetLeaf.openFile(focusedNode.file);
	}

	public toggleNodeSelection(focusedNode: FileExplorerNode) {
		if (this.fileExplorer.tree.selectedDoms.has(focusedNode)) {
			this.fileExplorer.tree.deselectItem(focusedNode);
		} else {
			this.fileExplorer.tree.selectItem(focusedNode);
		}
	}

	public clearSelectedNodes(): void {
		this.fileExplorer.tree.clearSelectedDoms();
	}

	/**
	 * Opens selected files (or focused file) in a new window.
	 */
	public async openFileInNewWindow(focusedNode: FileExplorerFileNode) {
		const selectedFiles = Array.from(this.fileExplorer.tree.selectedDoms).filter((node) =>
			isFileNode(node),
		);
		const newLeaf = this.app.workspace.getLeaf("window");

		if (selectedFiles.length === 0) {
			await newLeaf.openFile(focusedNode.file);
		} else {
			await this.openSelectedFilesInNewWindow(newLeaf, selectedFiles);
		}
	}

	private async openSelectedFilesInNewWindow(
		windowLeaf: WorkspaceLeaf,
		selectedFiles: FileExplorerFileNode[],
	) {
		const tabs = windowLeaf.parent;
		if (!(tabs instanceof WorkspaceTabs)) {
			return;
		}

		// NOTE: using a "for" loop to preserve the order of selected nodes.
		for (let i = 0; i < selectedFiles.length; i++) {
			const selectedFileNode = selectedFiles[i];

			// NOTE: this check required to satisfy `noUncheckedIndexedAccess: true`.
			if (selectedFileNode == null) {
				continue;
			}

			if (i === 0) {
				// NOTE: skipping tab creation for the first file, as it already created by `getLeaf`
				await windowLeaf.openFile(selectedFileNode.file);
			} else {
				// @ts-ignore // "this.app" is missing in typings
				const newTab = new WorkspaceLeaf(this.app);
				tabs.insertChild(tabs.children.length, newTab);
				await newTab.openFile(selectedFileNode.file);
			}
		}
	}

	public async toggleFilePreviewPopup(focusedNode: FileExplorerFileNode) {
		if (this.isPreviewPopupVisible) {
			this.hidePreviewPopup(focusedNode);
		} else if (focusedNode.el.children[0] != null) {
			await this.app.internalPlugins.plugins["page-preview"].instance.onLinkHover(
				this.fileExplorer,
				focusedNode.el.children[0],
				focusedNode.file.path,
				"",
			);
		}
	}

	// TODO: more testing needed.
	// public hidePreviewPopupIfActive() {
	// 	if (this.isPreviewPopupVisible) {
	// 		this.hidePreviewPopup();
	// 	}
	// }

	private hidePreviewPopup(focusedNode: FileExplorerFileNode) {
		if (focusedNode.el.children[0] == null) {
			return;
		}

		const event = new MouseEvent("mouseout", {
			bubbles: true,
			cancelable: true,
		});
		focusedNode.el.children[0].dispatchEvent(event);
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
