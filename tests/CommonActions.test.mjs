import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { buildSync } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const { outputFiles } = buildSync({
	absWorkingDir: root,
	stdin: {
		contents: `
			export { CommonActions } from "./src/CommonActions";
			export { FileExplorerKeysMapper } from "./src/views/file-explorer/FileExplorerKeysMapper";
		`,
		resolveDir: root,
		loader: "ts",
	},
	bundle: true,
	write: false,
	platform: "node",
	format: "cjs",
	external: ["obsidian"],
});

function setup({ isMacOS = true, viewType = "file-explorer", preventDuplicates = false } = {}) {
	class View {}
	class FileView extends View {}
	class MarkdownView extends FileView {}
	class WorkspaceTabs {}
	class KeyboardEvent {
		constructor(type, init) {
			this.type = type;
			this.shiftKey = false;
			Object.assign(this, init);
		}
	}
	const obsidian = { Platform: { isMacOS }, View, FileView, MarkdownView, WorkspaceTabs };
	const module = { exports: {} };
	runInNewContext(outputFiles[0].text, {
		module,
		KeyboardEvent,
		document: { querySelector: () => null },
		require(name) {
			assert.equal(name, "obsidian");
			return obsidian;
		},
	});
	const { CommonActions, FileExplorerKeysMapper } = module.exports;
	const file = { path: "note.md", extension: "md" };
	const events = [];
	const opened = [];
	const renamed = [];
	const expanded = [];
	const background = [];
	const activated = [];
	const leaves = [];
	const el = {
		dispatchEvent(event) {
			events.push(event);
			// Model Obsidian's native macOS File Explorer bindings.
			if (isMacOS && viewType === "file-explorer" && event.key === "Enter") {
				renamed.push(file);
			} else if (event.key === "Enter" || (viewType === "file-explorer" && event.key === " ")) {
				opened.push(file);
			}
			return true;
		},
	};
	const view = {
		getViewType: () => viewType,
		tree: {
			focusedItem: { file, el },
			onKeyArrowRight: (event) => expanded.push(event),
		},
		onKeyRename: () => renamed.push(file),
	};
	const app = {
		workspace: {
			getActiveViewOfType: () => view,
			getMostRecentLeaf: () => ({
				openFile: async (file, options) => background.push({ file, options }),
			}),
			getLeavesOfType: () => leaves,
			setActiveLeaf: (leaf) => activated.push(leaf),
		},
	};
	const settings = { enableDuplicateOpenedFilesFiltering: preventDuplicates };
	class Actions extends CommonActions {
		get view() {
			return view;
		}
	}
	return {
		mapper: new FileExplorerKeysMapper(app, settings),
		actions: new Actions(app, settings),
		file,
		el,
		events,
		opened,
		renamed,
		expanded,
		background,
		activated,
		leaves,
		view,
		MarkdownView,
	};
}

test("l opens the focused file instead of renaming it on macOS", async () => {
	const context = setup();
	await context.mapper.handleKeyPress({ code: "KeyL", shiftKey: false });
	assert.deepEqual(context.opened, [context.file]);
	assert.deepEqual(context.renamed, []);
});

test("l retains native Enter opening on other platforms", async () => {
	const context = setup({ isMacOS: false });
	await context.mapper.handleKeyPress({ code: "KeyL", shiftKey: false });
	assert.deepEqual(context.opened, [context.file]);
	assert.equal(context.events[0].key, "Enter");
});

test("r still renames the focused file on macOS", async () => {
	const context = setup();
	await context.mapper.handleKeyPress({ code: "KeyR", shiftKey: false });
	assert.deepEqual(context.renamed, [context.file]);
	assert.deepEqual(context.opened, []);
});

test("l still expands folders", async () => {
	const context = setup();
	context.view.tree.focusedItem.file = { path: "folder" };
	const event = { code: "KeyL", shiftKey: false };
	await context.mapper.handleKeyPress(event);
	assert.deepEqual(context.expanded, [event]);
	assert.deepEqual(context.events, []);
});

test("Search still opens results using Enter on macOS", async () => {
	const context = setup({ viewType: "search" });
	await context.actions.openFile(context.file, context.el, {
		shouldFocus: true,
		shouldPreventDuplicate: false,
	});
	assert.deepEqual(context.opened, [context.file]);
	assert.equal(context.events[0].key, "Enter");
});

test("background opening keeps the current focus and ephemeral state", async () => {
	const context = setup();
	const eState = { match: { content: "match", matches: [[0, 5]] } };
	await context.actions.openFile(context.file, context.el, {
		shouldFocus: false,
		shouldPreventDuplicate: false,
		eState,
	});
	assert.equal(context.background.length, 1);
	assert.equal(context.background[0].file, context.file);
	assert.equal(context.background[0].options.eState, eState);
	assert.deepEqual(context.events, []);
	assert.deepEqual(context.activated, []);
});

test("duplicate filtering still reveals an already open file", async () => {
	const context = setup({ preventDuplicates: true });
	const view = new context.MarkdownView();
	view.file = context.file;
	const leaf = { view };
	context.leaves.push(leaf);
	await context.mapper.handleKeyPress({ code: "KeyL", shiftKey: false });
	assert.deepEqual(context.activated, [leaf]);
	assert.deepEqual(context.events, []);
});
