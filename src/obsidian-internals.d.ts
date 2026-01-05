import { TFile, TFolder, View } from "obsidian";

/**
 * Undocumented typings for Obsidian.
 */
declare module "obsidian" {
	interface Vault {
		getAvailablePath(path: string, extension: string): string;
	}

	interface FileExplorer extends View {
		tree: {
			focusedItem?: {
				file: TFile | TFolder | null;
				el: HTMLElement;
				parent: {
					parent: unknown;
					vChildren: {
						_children: { el: HTMLElement }[];
					};
				};
			};
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
