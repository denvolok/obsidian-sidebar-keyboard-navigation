# File Explorer Keyboard Nav

[Obsidian](https://obsidian.md/) plugin to enable keyboard based navigation(_vim-like by default_) and interaction in
the default [File Explorer](https://help.obsidian.md/plugins/file-explorer).
Inspired by Vim plugins like NERDTree and Neo-tree.

This plugin works best for users who prefer keyboard-based navigation and employ a simple workflow in Obsidian.

## Current State of The Plugin

The plugin is relatively new and under active development, so please use a sandbox(testing) Vault before enabling the
plugin for your
main Vault.

While current keyboard shortcuts have been thoroughly designed and made to be future-proof, they are subject to change.

## Features

- Use intuitive mappings for native Obsidian actions.
- Disable certain keys, if they interfere with your workflow (or other plugins).
- Minimal invasion to the default app functions (and your note-taking workflow).
- Changes(improvements) to the native Obsidian behavior
	- **Avoid duplicating opened files**: if trying to open an already opened file - focus it, instead of opening a
		duplicate tab (can be switched on/off).
	- **Background opening**: most file-opening actions allow you to open files in background, while keep the focus on
		File Explorer.
	- After deleting a node in File Explorer, automatically focus next/prev node, instead of loosing focus.

## Installation

1. Copy plugin folder into your Obsidian vault `VaultFolder/.obsidian/plugins/`.
2. Enable the plugin in Obsidian data.

## Usage

1. (Optional) Consider reviewing/setting the following key bindings provided by Obsidian, so you can use File Explorer
	 more efficiently:
	- `Files: Show file explorer`: focus File Explorer (e.g. `Alt+P`)
	- `Toggle left sidebar`: toggle File Explorer (e.g. `Alt+Shift+P`)
	- `Files: Reveal current file in navigation`: (e.g. `Alt+F1`, similar to one in Intellij IDEA)
	- `Focus on tab group to the right/lef/below/ebove`: to seamlessly switch between opened splits (e.g.
		`Ctrl- L/H/J/K`).
		You can also use `Esc` to switch from File Explorer to the last active Split.
2. (Optional) Open and review the plugin settings.
3. Focus file explorer using defined hotkey, or via "File: Reveal current file in navigation" action from Command
	 Palette.
4. Use [supported key bindings](#supported-key-bindings) to navigate file explorer and interact with entries.
	- For new users it's suggested to start with the most basic commands - `j`/`k`/`h`/`k`/`n`/`f`.

If, after some operations (e.g. after deleting a note via default mapping - `Ctrl-Shift-D`), you see that no nodes
focused - just press `j` or `k` to return focus.

## Available Actions

> **NOTE:** "focused node" - node with the cursor positioned on it(usually bordered), "selected node" - node selected
> via selection<br>
> Bindings are currently limited to using a single keystroke, and `Ctrl`/`Alt` modifiers are not used as these have high
> chances to interfere with the native bindings.

|        Key         | Action                                                                                                                                | Description                                                                                                                                                                                                                                                                                                             |                                                                                                                                           
|:------------------:|:--------------------------------------------------------------------------------------------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Base Movements** |                                                                                                                                       |                                                                                                                                                                                                                                                                                                                         |
|        `j`         | move down                                                                                                                             | Also works for context menu                                                                                                                                                                                                                                                                                             |
|        `J`         | move down, and if a file focused - preview in the Editor without switching focus                                                      |                                                                                                                                                                                                                                                                                                                         | 
|        `k`         | move up                                                                                                                               | Also works for context menu                                                                                                                                                                                                                                                                                             |
|        `K`         | move up, and if a file focused - preview in the Editor without switching focus                                                        |                                                                                                                                                                                                                                                                                                                         | 
|        `g`         | focus the topmost root node                                                                                                           |                                                                                                                                                                                                                                                                                                                         |
|        `G`         | focus the bottommost root node                                                                                                        |                                                                                                                                                                                                                                                                                                                         |
|        `v`         | toggle selection on focused node                                                                                                      |                                                                                                                                                                                                                                                                                                                         |
|        `V`         | clear selection (deselect all nodes)                                                                                                  |                                                                                                                                                                                                                                                                                                                         |
|        `;`         | toggle context menu for focused node                                                                                                  |                                                                                                                                                                                                                                                                                                                         |
|     **Folds**      |                                                                                                                                       |                                                                                                                                                                                                                                                                                                                         |
|        `h`         | a) *if an opened folder or a file focused* - close the current folder<br>b) *if a closed folder focused* -  jump to the parent folder |                                                                                                                                                                                                                                                                                                                         |
|        `H`         | a) *if an opened folder focused* - close it recursively<br>b) *if a closed folder, or a file focused* - jump to  the parent folder    |                                                                                                                                                                                                                                                                                                                         |
|        `l`         | a) *if a folder focused* - open it<br>b) *if a file focused* - open it in the recently active Editor                                  |                                                                                                                                                                                                                                                                                                                         |
|        `L`         | a) *if a folder focused* - expand it recursively<br>b) *if a file focused* - open it, but keep focus on File Explorer                 |                                                                                                                                                                                                                                                                                                                         |
|        `Z`         | collapse all Vault folders recursively                                                                                                |                                                                                                                                                                                                                                                                                                                         |
| **Opening Files**  |                                                                                                                                       |                                                                                                                                                                                                                                                                                                                         |
|        `s`         | open focused file in a new vertical split (`Open to the right`)                                                                       |                                                                                                                                                                                                                                                                                                                         |
|        `S`         | open focused file in a new vertical split, but keep focus on File Explorer                                                            |                                                                                                                                                                                                                                                                                                                         |
|        `i`         | open focused file in a new horizontal split                                                                                           |                                                                                                                                                                                                                                                                                                                         |
|        `I`         | open focused file in a new horizontal split, but keep focus on File Explorer                                                          |                                                                                                                                                                                                                                                                                                                         |
|        `t`         | open focused file in a new tab                                                                                                        |                                                                                                                                                                                                                                                                                                                         |
|        `T`         | open focused file in a new tab, but keep focus on File Explorer                                                                       |                                                                                                                                                                                                                                                                                                                         |
|        `w`         | open selected files, or focused file in new window                                                                                    |                                                                                                                                                                                                                                                                                                                         |
|        `o`         | show popup preview for the focused file                                                                                               | This actions is still unstable.<br>Currently, the action doesn't provide auto-hiding for the popup.<br> So you should hide it manually for each node<br> by pressing `o` on the same node, before continuing with other actions.<br>Alternatively, you can just mouse-click/mouse-move outside of the popup to hide it. |
|    **Editing**     |                                                                                                                                       |                                                                                                                                                                                                                                                                                                                         |
|        `n`         | create a new note inside the focused folder                                                                                           |                                                                                                                                                                                                                                                                                                                         |
|        `N`         | create a new note inside the parent folder                                                                                            |                                                                                                                                                                                                                                                                                                                         |
|        `f`         | create a new folder inside the focused folder                                                                                         |                                                                                                                                                                                                                                                                                                                         |
|        `F`         | create a new folder inside the parent folder                                                                                          |                                                                                                                                                                                                                                                                                                                         |
|        `r`         | rename focused node                                                                                                                   | Works as native `Rename`                                                                                                                                                                                                                                                                                                |
|        `c`         | clone focused node                                                                                                                    |                                                                                                                                                                                                                                                                                                                         |
|        `D`         | a) *if some nodes selected* - delete selected nodes<br>b) *otherwise* - delete focused node                                           | Works as native `Delete`                                                                                                                                                                                                                                                                                                |

> **NOTE:** mappings for some destructive actions (e.g. delete note/folder) are disabled by default in Settings,
> so you don't accidentally throw your precious stuff into the abyss, while exploring the plugin for the first time.

## Known Bugs and Current Limitations

- This plugin is indented to be used with the core [File Explorer](https://help.obsidian.md/plugins/file-explorer)
	plugin. So it might break your custom plugins which change the behaviour of the File Explorer.
- **The mappings will differ for non-QWERTY keyboard layouts**.
- **Key bindings are not configurable** as it might introduce unnecessary complexity for users (and
	development). The current bindings are based on similar classic plugins for Vim (like NERDTree).
- **Background-opening:** (`T`, `S`, `I`)
	- The position of a new tab/split will be related to the most recently focused split(or tab group). _There are
		some ideas how it could be improved, but more feedback needed_.
- **Multi-selection:** if you have some nodes selected (via `v`) and you move focus to a non-selected node,
	invoking the context menu (`;`) will open it for the focused node. If you want to show the context menu for selected
	nodes - you should move focus to one of selected nodes. _There is no technical limitation to fix it, but more feedback
	needed._
