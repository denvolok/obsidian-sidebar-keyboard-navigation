import {
	FileExplorerView,
	requireApiVersion,
	TFolder,
	View,
	WorkspaceLeaf,
	WorkspaceTabs,
} from "obsidian";
import { domUtils, removeExtensionFromPath } from "../../utils/utils";
import { isSearchView, ViewType } from "../../types";
import {
	FileExplorerFileNode,
	FileExplorerFolderNode,
	FileExplorerNode,
} from "../../types/obsidian-internals";
import { CommonActions } from "../../CommonActions";
import { isFileNode } from "./file-explorer-utils";
import { Logger } from "utils/logger";

export class FileExplorerActions extends CommonActions {
	protected get view(): FileExplorerView {
		return this.app.workspace.getActiveViewOfType(View) as FileExplorerView;
	}

	public collapseAllFolders(): void {
		this.view.tree.isAllCollapsed = false;
		this.view.tree.setCollapseAll(true);
	}

	public moveFocusDown(_event: KeyboardEvent): void {
		let event = _event;

		if (event.shiftKey) {
			// NOTE: removing "shiftKey" from the event to avoid app's native behavior to select focused item.
			event = new KeyboardEvent("keydown", {
				key: "ArrowDown",
				bubbles: true,
				cancelable: true,
			});
		}

		this.view.tree.onKeyArrowDown(event);
	}

	public moveFocusUp(_event: KeyboardEvent): void {
		let event = _event;

		if (event.shiftKey) {
			// NOTE: removing "shiftKey" from the event to avoid app's native behavior to select focused item.
			event = new KeyboardEvent("keydown", {
				key: "ArrowUp",
				bubbles: true,
				cancelable: true,
			});
		}

		this.view.tree.onKeyArrowUp(event);
	}

	public collapseCurrentFolder(event: KeyboardEvent): void {
		this.view.tree.onKeyArrowLeft(event);
	}

	public expandFolder(event: KeyboardEvent): void {
		this.view.tree.onKeyArrowRight(event);
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
			window.setTimeout(() => {
				const isFileExplorerFocused =
					this.app.workspace.getActiveViewOfType(View)?.getViewType() === ViewType.FileExplorer;

				// NOTE: it's the case when after deleting a note, the focus will switch to the editor.
				if (!isFileExplorerFocused) {
					return;
				}

				this.view.tree.setFocusedItem(nextNodeToFocus);
			}, 70);
		}
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
			this.view.createAbstractFile(nodeType, folder, false);
		}
	}

	public async cloneNode(focusedNode: FileExplorerNode): Promise<void> {
		if (requireApiVersion("1.8.7")) {
			const isFile = isFileNode(focusedNode);
			const destPath = this.app.vault.getAvailablePath(
				isFile ? removeExtensionFromPath(focusedNode.file.path) : focusedNode.file.path,
				isFile ? focusedNode.file.extension : undefined,
			);

			await this.app.vault.copy(focusedNode.file, destPath);
		} else {
			Logger.warn(" failed copy. Min app version required: 1.8.7");
		}
	}

	public focusParentNode(focusedNode: FileExplorerNode): void {
		this.view.tree.setFocusedItem(focusedNode.parent);
	}

	public focusFirstRootNode(): void {
		const firstRootNode = this.view.tree.root.vChildren.children[0];
		this.view.tree.setFocusedItem(firstRootNode);
	}

	public focusLastRootNode(): void {
		const lastRootNode = this.view.tree.root.vChildren.children.slice(-1)[0];
		this.view.tree.setFocusedItem(lastRootNode);
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
		this.view.onKeyRename(event);
	}

	public toggleNodeSelection(focusedNode: FileExplorerNode) {
		if (this.view.tree.selectedDoms.has(focusedNode)) {
			this.view.tree.deselectItem(focusedNode);
		} else {
			this.view.tree.selectItem(focusedNode);
		}
	}

	public clearSelectedNodes(): void {
		this.view.tree.clearSelectedDoms();
	}

	/**
	 * Opens selected files (or focused file) in a new window.
	 */
	public async openFileInNewWindow(focusedNode: FileExplorerFileNode) {
		const selectedFiles = Array.from(this.view.tree.selectedDoms).filter((node) =>
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
		if (domUtils.isPreviewPopupVisible()) {
			this.hidePreviewPopup(focusedNode);
		} else if (focusedNode.el.children[0] != null) {
			await this.app.internalPlugins.plugins["page-preview"].instance.onLinkHover(
				this.view,
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
	 * Opens global search toolbar and sets search path to the currently focused folder.
	 *
	 * Changes to the native behavior: clear text selection in the search input so user
	 * can start typing the search term immediately.
	 */
	public async searchInFolder(focusedNode: FileExplorerNode) {
		if (requireApiVersion("1.7.2")) {
			await this.app.workspace.ensureSideLeaf("search", "left", {
				active: true,
				reveal: true,
				state: {
					query: `path:"${focusedNode.file.path}/" `,
				},
			});

			window.setTimeout(() => {
				const activeView = this.app.workspace.getActiveViewOfType(View);

				if (activeView != null && isSearchView(activeView)) {
					const searchInput = activeView.searchComponent.inputEl;
					searchInput.selectionStart = searchInput.selectionEnd;
				}
			}, 10);
		} else {
			Logger.warn(" failed search in folder. Min app version required: 1.7.2");
		}
	}
}
