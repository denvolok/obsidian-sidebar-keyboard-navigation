import {
	App,
	FileExplorer,
	FileView,
	SplitDirection,
	View,
	WorkspaceLeaf,
	WorkspaceTabs,
} from "obsidian";
import { removeExtensionFromPath } from "./utils/utils";
import { isFileItem } from "./utils/types";
import { FileExplorerNode } from "./obsidian-internals";

export class Actions {
	constructor(private app: App) {}

	private get fileExplorer(): FileExplorer {
		return this.app.workspace.getActiveViewOfType(View) as FileExplorer;
	}

	/**
	 * NOTE: using extra selectors to avoid potential classname collisions.
	 */
	private get isContextMenuOpened(): boolean {
		return document.querySelector(".menu > .menu-scroll") != null;
	}

	public collapseAllFolders(): void {
		this.fileExplorer.tree.isAllCollapsed = false;
		this.fileExplorer.tree.setCollapseAll(true);
	}

	public toggleContextMenu(): void {
		if (this.isContextMenuOpened) {
			const ev = new KeyboardEvent("keydown", {
				key: "Escape",
				bubbles: true,
				cancelable: true,
			});
			document.dispatchEvent(ev);
		} else {
			const focusedElement = this.fileExplorer.tree.focusedItem?.el.querySelector(
				".nav-folder-title, .nav-file-title",
			);

			if (focusedElement == null) {
				return;
			}

			const contextmenuEvent = new MouseEvent("contextmenu", {
				bubbles: true,
				cancelable: true,
				view: window,
				clientX: focusedElement.getBoundingClientRect().left,
				clientY: focusedElement.getBoundingClientRect().top,
			});

			focusedElement.dispatchEvent(contextmenuEvent);
		}
	}

	public moveFocusDown(event: KeyboardEvent): void {
		if (this.isContextMenuOpened) {
			const ev = new KeyboardEvent("keydown", {
				key: "ArrowDown",
				bubbles: true,
				cancelable: true,
			});
			document.dispatchEvent(ev);
		} else {
			this.fileExplorer.tree.onKeyArrowDown(event);
		}
	}

	public moveFocusUp(event: KeyboardEvent): void {
		if (this.isContextMenuOpened) {
			const ev = new KeyboardEvent("keydown", {
				key: "ArrowUp",
				bubbles: true,
				cancelable: true,
			});
			document.dispatchEvent(ev);
		} else {
			this.fileExplorer.tree.onKeyArrowUp(event);
		}
	}

	public deleteEntryAndFocusNext(): void {
		const { focusedItem } = this.fileExplorer.tree;

		if (focusedItem == null) {
			return;
		}

		const focusedItemIdx = focusedItem.parent.vChildren.children.findIndex(
			(children) => children.el === focusedItem.el,
		);
		const isSelectedItemSingleChild = focusedItem.parent.vChildren.children.length === 1;
		let nextItemToFocus;

		if (isSelectedItemSingleChild) {
			// TODO: should handle case when deleting multiple items. Currently no item focused.
			const isSelectedItemChildOfRootNode = focusedItem.parent.parent == null;
			nextItemToFocus = isSelectedItemChildOfRootNode ? null : focusedItem.parent;
		} else {
			nextItemToFocus =
				focusedItem.parent.vChildren.children[focusedItemIdx + 1] ??
				focusedItem.parent.vChildren.children[focusedItemIdx - 1];
		}

		const ev = new KeyboardEvent("keydown", {
			key: "Delete",
			bubbles: true,
			cancelable: true,
		});
		document.dispatchEvent(ev);

		if (nextItemToFocus != null) {
			// NOTE: trying to reduce flickering using setTimeout.
			setTimeout(() => {
				const isFileExplorerFocused =
					this.app.workspace.getActiveViewOfType(View)?.getViewType() === "file-explorer";

				// NOTE: in some cases, after deleting a note, the focus will switch to the main view, and we can't use `setFocusedItem` then.
				if (!isFileExplorerFocused) {
					return;
				}

				this.fileExplorer.tree.setFocusedItem(nextItemToFocus);
			}, 70);
		}
	}

	public async openFileWithoutFocusOrExpandFolder(): Promise<void> {
		const { focusedItem } = this.fileExplorer.tree;

		if (focusedItem?.file == null) {
			return;
		}

		if (isFileItem(focusedItem.file)) {
			const recentLeaf = this.app.workspace.getMostRecentLeaf()!;
			await recentLeaf.openFile(focusedItem.file);
		} else {
			this.recursivelySetCollapsed({ node: focusedItem, isCollapsed: false });
		}
	}

	public async openFocusedEntryInNewSplit(data: {
		direction: SplitDirection;
		shouldFocus: boolean;
	}): Promise<void> {
		const { focusedItem } = this.fileExplorer.tree;

		if (focusedItem?.file == null || !isFileItem(focusedItem.file)) {
			return;
		}

		let newLeaf: WorkspaceLeaf;

		if (data.shouldFocus) {
			newLeaf = this.app.workspace.getLeaf("split", data.direction);
		} else {
			const recentLeaf = this.app.workspace.getMostRecentLeaf()!;
			// @ts-ignore // "this.app" is not in typings
			newLeaf = new WorkspaceLeaf(this.app);
			this.app.workspace.splitLeaf(recentLeaf, newLeaf, data.direction);
		}

		await newLeaf.openFile(focusedItem.file);
	}

	public createNewEntry(itemType: "file" | "folder"): void {
		const focusedItem = this.fileExplorer.tree.focusedItem;

		if (focusedItem?.file == null) {
			return;
		}

		const folder = isFileItem(focusedItem.file) ? focusedItem.file.parent : focusedItem.file;
		this.fileExplorer.createAbstractFile(itemType, folder, false);
	}

	public async cloneEntry(): Promise<void> {
		const file = this.fileExplorer.tree.focusedItem?.file;

		if (file == null || !isFileItem(file)) {
			return;
		}

		const destPath = this.app.vault.getAvailablePath(
			removeExtensionFromPath(file.path),
			file.extension,
		);
		await this.app.vault.copy(file, destPath);
	}

	public focusParentOrCollapseRecursively(): void {
		const { focusedItem } = this.fileExplorer.tree;

		if (focusedItem == null) {
			return;
		}

		if ("collapsed" in focusedItem && !focusedItem.collapsed) {
			this.recursivelySetCollapsed({ node: focusedItem, isCollapsed: true });
		} else {
			this.fileExplorer.tree.setFocusedItem(focusedItem.parent);
		}
	}

	private recursivelySetCollapsed(data: { node: FileExplorerNode; isCollapsed: boolean }): void {
		const { node, isCollapsed } = data;

		if ("collapsed" in node && node.collapsed !== isCollapsed) {
			node.setCollapsed(isCollapsed);
		}

		if ("vChildren" in node) {
			for (const child of node.vChildren.children) {
				this.recursivelySetCollapsed({ node: child, isCollapsed });
			}
		}
	}

	public async openFileInNewTabAndFocus() {
		const { focusedItem } = this.fileExplorer.tree;

		if (focusedItem?.file == null || !isFileItem(focusedItem.file)) {
			return;
		}

		const newLeaf = this.app.workspace.getLeaf("tab");
		await newLeaf.openFile(focusedItem.file);
		this.app.workspace.setActiveLeaf(newLeaf, { focus: true });
	}

	/**
	 * NOTE: this action uses a modified version of the `createLeafInTabGroup` function,
	 * so it more likely to introduce bugs after Obsidian updates related logic.
	 */
	public async openFileInNewTabWithoutFocus() {
		const { focusedItem } = this.fileExplorer.tree;
		if (focusedItem?.file == null || !isFileItem(focusedItem.file)) {
			return;
		}

		const recentLeaf = this.app.workspace.getMostRecentLeaf();
		if (recentLeaf == null) {
			throw new Error("No tab group found");
		}

		const tabs = recentLeaf.parent as WorkspaceTabs;
		const rightmostTabInRecentLeaf = tabs.children.slice(-1)[0]!;
		const isEmptyTab = rightmostTabInRecentLeaf.view instanceof FileView === false;

		let targetLeaf: WorkspaceLeaf;

		if (isEmptyTab) {
			targetLeaf = recentLeaf;
		} else {
			// @ts-ignore // "this.app" is not in typings
			targetLeaf = new WorkspaceLeaf(this.app);
			tabs.insertChild(tabs.children.length, targetLeaf);
		}

		await targetLeaf.openFile(focusedItem.file);
	}

	public toggleItemSelection() {
		const { focusedItem } = this.fileExplorer.tree;
		if (focusedItem == null) {
			return;
		}

		if (this.fileExplorer.tree.selectedDoms.has(focusedItem)) {
			this.fileExplorer.tree.deselectItem(focusedItem);
		} else {
			this.fileExplorer.tree.selectItem(focusedItem);
		}
	}
}
