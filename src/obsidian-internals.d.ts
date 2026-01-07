import { SplitDirection, TFile, TFolder, View, WorkspaceLeaf } from "obsidian";

export interface FileExplorerNodeBase {
	coverEl: HTMLElement;
	el: HTMLElement;
	parent: FileExplorerFolderNode;
}

export interface FileExplorerFileNode extends FileExplorerNodeBase {
	file: TFile;
}

export interface FileExplorerFolderNode extends FileExplorerNodeBase {
	file: TFolder;
	collapsed: boolean;
	collapsible: boolean;
	vChildren: {
		children: FileExplorerNode[];
	};

	setCollapsed(isCollapsed: boolean): unknown;
}

export type FileExplorerNode = FileExplorerFileNode | FileExplorerFolderNode;

/**
 * Undocumented typings for Obsidian.
 */
declare module "obsidian" {
	interface Vault {
		getAvailablePath(path: string, extension: string): string;
	}

	interface Workspace {
		splitLeaf(
			recentLeaf: WorkspaceLeaf,
			newLeaf: WorkspaceLeaf,
			direction: SplitDirection,
			n?: unknown,
		): void;
	}

	interface WorkspaceTabs {
		children: WorkspaceLeaf[];
		insertChild: (idx: number, leaf: WorkspaceLeaf) => unknown;
	}

	interface FileExplorer extends View {
		tree: {
			root: {
				vChildren: { children: FileExplorerNode[] };
			};
			focusedItem?: FileExplorerNode;
			isAllCollapsed: boolean;
			selectedDoms: Set<FileExplorerNode>;
			onKeyArrowDown(event: KeyboardEvent): unknown;
			onKeyArrowUp(j: KeyboardEvent): void;
			onKeyArrowLeft(event: KeyboardEvent): void;
			onKeyArrowRight(event: KeyboardEvent): void;
			setCollapseAll(b: boolean): void;
			handleDeleteSelectedItems(): unknown;
			setFocusedItem(e: unknown, someParamRelatedToScrolling?: unknown): unknown;
			changeFocusedItem(direction: "forwards" | "backwards"): void;
			selectItem(item: FileExplorerNode): void;
			deselectItem(item: FileExplorerNode): void;
			clearSelectedDoms(): void;
		};

		createAbstractFile(itemType: string, folder: TFolder, b: boolean): unknown;

		onKeyRename(event: KeyboardEvent): void;

		onKeyOpen(event: KeyboardEvent): void;
	}
}
