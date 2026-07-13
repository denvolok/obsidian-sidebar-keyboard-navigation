import { FileExplorerFileNode, FileExplorerNode } from "./obsidian-internals";
import { SearchView, View } from "obsidian";

export function isFileNode(node: FileExplorerNode): node is FileExplorerFileNode {
	return "extension" in node.file;
}

export interface KeysMapper {
	handleKeyPress(event: KeyboardEvent): Promise<void>;
}

export enum ViewType {
	FileExplorer = "file-explorer",
}

export function isSearchView(view: View): view is SearchView {
	return "searchComponent" in view;
}
