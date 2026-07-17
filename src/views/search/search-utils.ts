import { SearchFileNode, SearchNode } from "../../types/obsidian-internals";

export function isFileNode(node: SearchNode): node is SearchFileNode {
	return "selfEl" in node;
}
