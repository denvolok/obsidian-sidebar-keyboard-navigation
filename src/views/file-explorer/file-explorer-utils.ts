import { FileExplorerFileNode, FileExplorerNode } from "../../types/obsidian-internals";

export function isFileNode(node: FileExplorerNode): node is FileExplorerFileNode {
	return "extension" in node.file;
}
