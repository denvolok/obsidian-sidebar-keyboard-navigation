import { SplitDirection, TFile, TFolder, View, WorkspaceLeaf } from "obsidian";

export interface FileExplorerNodeBase {
	coverEl: HTMLElement;
	file: TFile | TFolder | null;
	el: HTMLElement;
	parent: FileExplorerFolderNode;
}

export type FileExplorerFileNode = FileExplorerFolderNode;

export interface FileExplorerFolderNode extends FileExplorerNodeBase {
	collapsed?: boolean;
	vChildren: {
		children: FileExplorerNode[];
	};

	setCollapsed(isCollapsed: boolean): unknown;
}

// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
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

	interface FileExplorer extends View {
		tree: {
			focusedItem?: FileExplorerNode;
			isAllCollapsed: boolean;
			onKeyArrowDown(event: KeyboardEvent): unknown;
			onKeyArrowUp(j: KeyboardEvent): void;
			onKeyArrowLeft(event: KeyboardEvent): void;
			onKeyArrowRight(event: KeyboardEvent): void;
			setCollapseAll(b: boolean): void;
			handleDeleteSelectedItems(): unknown;
			setFocusedItem(e: unknown, someParamRelatedToScrolling?: unknown): unknown;
			changeFocusedItem(direction: "forwards" | "backwards"): void;
		};

		createAbstractFile(itemType: string, folder: null | TFolder, b: boolean): unknown;
	}
}
