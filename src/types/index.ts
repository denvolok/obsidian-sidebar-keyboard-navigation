import { SearchView, View } from "obsidian";

export enum ViewType {
	FileExplorer = "file-explorer",
	Search = "search",
}

export function isSearchView(view: View): view is SearchView {
	return "searchComponent" in view;
}
