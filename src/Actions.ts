import { App, FileExplorer, SplitDirection, View } from "obsidian";
import { removeExtensionFromPath } from "./utils/utils";
import { isFileItem } from "./utils/types";

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

	public collapseAllFolders() {
		this.fileExplorer.tree.isAllCollapsed = false;
		this.fileExplorer.tree.setCollapseAll(true);
	}

	public toggleContextMenu() {
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

	public onKeyArrowDown(event: KeyboardEvent) {
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

	public onKeyArrowUp(event: KeyboardEvent) {
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

	public async openInNewSplit(direction: SplitDirection) {
		const selectedItem = this.fileExplorer.tree.focusedItem?.file;

		if (selectedItem != null && isFileItem(selectedItem)) {
			const newLeaf = this.app.workspace.getLeaf("split", direction);
			await newLeaf.openFile(selectedItem);
		}
	}

	public createNewItem(itemType: "file" | "folder") {
		const selectedItem = this.fileExplorer.tree.focusedItem?.file;

		if (selectedItem == null) {
			return;
		}

		const folder = isFileItem(selectedItem) ? selectedItem.parent : selectedItem;
		this.fileExplorer.createAbstractFile(itemType, folder, false);
	}

	public async cloneFile() {
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
}
