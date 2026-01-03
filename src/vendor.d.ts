import { TFile, TFolder, View } from "obsidian";

declare module "obsidian" {
	interface Vault {
		getAvailablePath(path: string, extension: string): string;
	}

	interface FileExplorer extends View {
		tree: {
			focusedItem: {
				file: TFile | TFolder | null;
				el: HTMLElement;
			};
			isAllCollapsed: boolean;
			onKeyArrowDown(event: KeyboardEvent): unknown;
			onKeyArrowUp(j: KeyboardEvent): void;
			onKeyArrowLeft(event: KeyboardEvent): void;
			onKeyArrowRight(event: KeyboardEvent): void;
			setCollapseAll(b: boolean): void;
		};
		createAbstractFile(itemType: string, folder: null | TFolder, b: boolean): unknown;
	}
}
