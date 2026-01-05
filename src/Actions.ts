import { App, FileExplorer, SplitDirection, View, WorkspaceLeaf } from "obsidian";
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

	public onKeyArrowDown(event: KeyboardEvent): void {
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

	public onKeyArrowUp(event: KeyboardEvent): void {
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
		const selectedElement = this.fileExplorer.tree.focusedItem;

		if (selectedElement == null) {
			// NOTE: never reproduced such case, but avoiding it since may cause unexpected destructive actions.
			return;
		}

		const selectedItemIdx = selectedElement.parent.vChildren.children.findIndex(
			(children) => children.el === selectedElement.el,
		);
		const isSelectedItemSingleChild = selectedElement.parent.vChildren.children.length === 1;
		let nextItemToFocus;

		if (isSelectedItemSingleChild) {
			const isSelectedItemChildOfRootNode = selectedElement.parent.parent == null;
			nextItemToFocus = isSelectedItemChildOfRootNode ? null : selectedElement.parent;
		} else {
			nextItemToFocus =
				selectedElement.parent.vChildren.children[selectedItemIdx + 1] ??
				selectedElement.parent.vChildren.children[selectedItemIdx - 1];
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

	public async openFocusedEntryWithoutSwitch(): Promise<void> {
		const selectedItem = this.fileExplorer.tree.focusedItem?.file;

		if (selectedItem == null || !isFileItem(selectedItem)) {
			return;
		}

		const recentLeaf = this.app.workspace.getMostRecentLeaf()!;
		await recentLeaf.openFile(selectedItem);
	}

	public async openFocusedEntryInNewSplit(data: {
		direction: SplitDirection;
		shouldFocus: boolean;
	}): Promise<void> {
		const selectedItem = this.fileExplorer.tree.focusedItem?.file;

		if (selectedItem == null || !isFileItem(selectedItem)) {
			return;
		}

		let newLeaf: WorkspaceLeaf;

		if (data.shouldFocus) {
			newLeaf = this.app.workspace.getLeaf("split", data.direction);
		} else {
			const recentLeaf = this.app.workspace.getMostRecentLeaf()!;
			// @ts-ignore
			newLeaf = new WorkspaceLeaf(this.app);
			this.app.workspace.splitLeaf(recentLeaf, newLeaf, data.direction);
		}

		await newLeaf.openFile(selectedItem);
	}

	public createNewEntry(itemType: "file" | "folder"): void {
		const selectedItem = this.fileExplorer.tree.focusedItem?.file;

		if (selectedItem == null) {
			return;
		}

		const folder = isFileItem(selectedItem) ? selectedItem.parent : selectedItem;
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
		const selectedItem = this.fileExplorer.tree.focusedItem;

		if (selectedItem?.parent == null) {
			return;
		}

		if (selectedItem.collapsed === false) {
			this.recursivelyCollapseNode(selectedItem);
		} else {
			this.fileExplorer.tree.setFocusedItem(selectedItem.parent);
		}
	}

	private recursivelyCollapseNode(node: FileExplorerNode): void {
		if (node.collapsed === false) {
			node.setCollapsed(true);
		}

		if (node.vChildren != null) {
			for (const c of node.vChildren.children) {
				this.recursivelyCollapseNode(c);
			}
		}
	}
}
