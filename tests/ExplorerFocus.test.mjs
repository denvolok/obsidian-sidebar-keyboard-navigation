import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { buildSync } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const { outputFiles } = buildSync({
	absWorkingDir: root,
	entryPoints: ["src/main.ts"],
	bundle: true,
	write: false,
	platform: "node",
	format: "cjs",
	external: ["obsidian"],
});

async function setup(settings = {}) {
	const saved = [];
	const controls = [];
	const errors = [];
	const listeners = new Set();
	const workspaceListeners = new Map();
	class View {
		constructor(type) {
			this.type = type;
		}
		getViewType() {
			return this.type;
		}
	}
	class Plugin {
		constructor(app) {
			this.app = app;
		}
		async loadData() {
			return { settings };
		}
		async saveData(data) {
			saved.push(JSON.parse(JSON.stringify(data)));
		}
		addSettingTab(tab) {
			this.settingsTab = tab;
		}
		registerEvent() {}
	}
	class PluginSettingTab {
		constructor() {
			this.containerEl = { empty() {} };
		}
	}
	class Setting {
		constructor() {
			controls.push(this);
		}
		setName(name) {
			this.name = name;
			return this;
		}
		setDesc() {
			return this;
		}
		setDisabled() {
			return this;
		}
		addText(callback) {
			callback(this);
			return this;
		}
		addToggle(callback) {
			callback(this);
			return this;
		}
		setPlaceholder() {
			return this;
		}
		setValue(value) {
			this.value = value;
			return this;
		}
		onChange(callback) {
			this.change = callback;
			return this;
		}
	}
	class KeyboardEvent {
		constructor(type, init) {
			this.type = type;
			Object.assign(this, init);
		}
		preventDefault() {}
		stopImmediatePropagation() {}
	}
	const obsidian = { Plugin, PluginSettingTab, Setting, View, requireApiVersion: () => true };
	const module = { exports: {} };
	runInNewContext(outputFiles[0].text, {
		module,
		KeyboardEvent,
		console: { error: (message) => errors.push(message) },
		document: {
			activeElement: null,
			querySelector: () => null,
			addEventListener: (_, listener) => listeners.add(listener),
			removeEventListener: (_, listener) => listeners.delete(listener),
		},
		require(name) {
			assert.equal(name, "obsidian");
			return obsidian;
		},
	});
	const nodes = Array.from({ length: 8 }, (_, index) => ({
		file: { path: `${index + 1}.md`, extension: "md" },
	}));
	const focusChanges = [];
	const reveals = [];
	const explorerView = new View("file-explorer");
	explorerView.activeDom = nodes[1];
	explorerView.revealActiveFile = () => {
		reveals.push(explorerView.activeDom);
		let parent = explorerView.activeDom.parent;
		while (parent != null) {
			parent.collapsed = false;
			parent = parent.parent;
		}
	};
	explorerView.tree = {
		focusedItem: nodes[6],
		setFocusedItem(node) {
			focusChanges.push(node);
			this.focusedItem = node;
		},
		onKeyArrowDown() {
			this.setFocusedItem(nodes[Math.min(nodes.indexOf(this.focusedItem) + 1, nodes.length - 1)]);
		},
		onKeyArrowUp() {
			this.setFocusedItem(nodes[Math.max(nodes.indexOf(this.focusedItem) - 1, 0)]);
		},
	};
	const explorer = { view: explorerView };
	const editor = { view: new View("markdown") };
	const search = { view: new View("search") };
	const workspace = {
		activeLeaf: editor,
		on(name, callback) {
			workspaceListeners.set(name, callback);
			return { name };
		},
		getActiveViewOfType() {
			return this.activeLeaf?.view ?? null;
		},
	};
	const plugin = new module.exports.default({ workspace });
	await plugin.onload();
	function focus(leaf) {
		workspace.activeLeaf = leaf;
		workspaceListeners.get("active-leaf-change")(leaf);
	}
	async function press(code) {
		const event = new KeyboardEvent("keydown", { code, shiftKey: false });
		for (const listener of listeners) listener(event);
		await new Promise(setImmediate);
		assert.deepEqual(errors, []);
	}
	return {
		plugin,
		focus,
		press,
		explorer,
		editor,
		search,
		nodes,
		focusChanges,
		reveals,
		controls,
		saved,
	};
}

test("j moves from active file 2 to file 3 instead of remembered file 7", async () => {
	const context = await setup({ focusActiveFileOnExplorerFocus: true });
	context.focus(context.explorer);
	assert.equal(context.explorer.view.tree.focusedItem, context.nodes[1]);
	await context.press("KeyJ");
	assert.equal(context.explorer.view.tree.focusedItem, context.nodes[2]);
});

test("k moves to the file before the active file", async () => {
	const context = await setup({ focusActiveFileOnExplorerFocus: true });
	context.focus(context.explorer);
	await context.press("KeyK");
	assert.equal(context.explorer.view.tree.focusedItem, context.nodes[0]);
});

test("no active file preserves the previous cursor position", async () => {
	const context = await setup({ focusActiveFileOnExplorerFocus: true });
	context.explorer.view.activeDom = null;
	context.focus(context.explorer);
	assert.deepEqual(context.focusChanges, []);
	assert.deepEqual(context.reveals, []);
	await context.press("KeyJ");
	assert.equal(context.explorer.view.tree.focusedItem, context.nodes[7]);
});

test("the setting defaults to off for existing installations", async () => {
	const context = await setup({ excludedKeys: "D" });
	assert.equal(context.plugin.data.settings.focusActiveFileOnExplorerFocus, false);
	assert.equal(context.plugin.data.settings.excludedKeys, "D");
	context.focus(context.explorer);
	await context.press("KeyK");
	assert.equal(context.explorer.view.tree.focusedItem, context.nodes[5]);
	assert.deepEqual(context.reveals, []);
});

test("repeated leaf events during navigation do not reset the cursor", async () => {
	const context = await setup({ focusActiveFileOnExplorerFocus: true });
	context.focus(context.explorer);
	await context.press("KeyJ");
	context.focus(context.explorer);
	await context.press("KeyJ");
	assert.equal(context.explorer.view.tree.focusedItem, context.nodes[3]);
	assert.equal(context.reveals.length, 1);
});

test("returning from another editor anchors navigation to its active file", async () => {
	const context = await setup({ focusActiveFileOnExplorerFocus: true });
	context.focus(context.explorer);
	await context.press("KeyJ");
	context.focus(context.editor);
	context.explorer.view.activeDom = context.nodes[4];
	context.focus(context.explorer);
	await context.press("KeyJ");
	assert.equal(context.explorer.view.tree.focusedItem, context.nodes[5]);
});

test("Search and editor focus do not move the File Explorer cursor", async () => {
	const context = await setup({ focusActiveFileOnExplorerFocus: true });
	context.focus(context.editor);
	context.focus(context.search);
	assert.equal(context.explorer.view.tree.focusedItem, context.nodes[6]);
	assert.deepEqual(context.focusChanges, []);
});

test("the active file is revealed before moving the keyboard cursor", async () => {
	const context = await setup({ focusActiveFileOnExplorerFocus: true });
	const outer = { collapsed: true };
	const inner = { collapsed: true, parent: outer };
	context.nodes[1].parent = inner;
	context.explorer.view.tree.setFocusedItem = (node) => {
		assert.equal(inner.collapsed, false);
		assert.equal(outer.collapsed, false);
		context.explorer.view.tree.focusedItem = node;
	};
	context.focus(context.explorer);
	assert.equal(context.explorer.view.tree.focusedItem, context.nodes[1]);
	assert.deepEqual(context.reveals, [context.nodes[1]]);
});

test("the settings toggle saves the preference and applies on the next entry", async () => {
	const context = await setup();
	context.plugin.settingsTab.display();
	const toggle = context.controls.find((control) => control.name === "Focus active file on entry");
	assert.equal(toggle.value, false);
	await toggle.change(true);
	assert.equal(context.saved.at(-1).settings.focusActiveFileOnExplorerFocus, true);
	context.focus(context.explorer);
	assert.equal(context.explorer.view.tree.focusedItem, context.nodes[1]);
	context.focus(context.editor);
	await toggle.change(false);
	context.explorer.view.tree.focusedItem = context.nodes[6];
	context.focus(context.explorer);
	assert.equal(context.explorer.view.tree.focusedItem, context.nodes[6]);
});
