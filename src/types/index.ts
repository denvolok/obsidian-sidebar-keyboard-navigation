import { FileExplorerFileNode, FileExplorerNode } from "./obsidian-internals";
import { SearchView, View } from "obsidian";

export function isFileNode(node: FileExplorerNode): node is FileExplorerFileNode {
	return "extension" in node.file;
}

export enum ViewType {
	FileExplorer = "file-explorer",
	Search = "search",
}

export function isSearchView(view: View): view is SearchView {
	return "searchComponent" in view;
}
