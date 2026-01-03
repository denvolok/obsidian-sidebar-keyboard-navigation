import { TFile, TFolder } from "obsidian";

export function isFileItem(item: TFile | TFolder): item is TFile {
	return item instanceof TFile;
}
