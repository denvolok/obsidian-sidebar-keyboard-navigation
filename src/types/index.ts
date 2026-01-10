import { FileExplorerFileNode, FileExplorerNode } from "./obsidian-internals";

export function isFileNode(node: FileExplorerNode): node is FileExplorerFileNode {
	return "extension" in node.file;
}

export interface KeysMapper {
	handleKeyPress(event: KeyboardEvent): Promise<void>;
}

export enum ViewType {
	FileExplorer = "file-explorer",
}
