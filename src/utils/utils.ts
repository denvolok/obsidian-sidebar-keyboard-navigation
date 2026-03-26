export function removeExtensionFromPath(path: string) {
	const t = path.lastIndexOf(".");
	return t === -1 || t === path.length - 1 || t === 0 ? path : path.slice(0, t);
}

/**
 * Example: "A" => { code: "KeyA", shiftKey: true }
 */
export function mapCharacterToKeystroke(char: string): { code: string; shiftKey: boolean } {
	if (/^[a-z]$/.exec(char)) {
		return {
			code: `Key${char.toUpperCase()}`,
			shiftKey: false,
		};
	} else if (/^[A-Z]$/.exec(char)) {
		return {
			code: `Key${char}`,
			shiftKey: true,
		};
	} else {
		switch (char) {
			case ";":
				return { code: "Semicolon", shiftKey: false };
			case ":":
				return { code: "Semicolon", shiftKey: true };
			case "?":
				return { code: "Slash", shiftKey: true };
			default:
				throw new Error(`Unexpected character: ${char}`);
		}
	}
}

export const domUtils = {
	isContextMenuOpened(): boolean {
		// NOTE: using extra selectors to avoid potential classname collisions
		return document.querySelector(".menu > .menu-scroll") != null;
	},
	isPreviewPopupVisible(): boolean {
		return document.querySelector(".popover.hover-popover") != null;
	},
};
