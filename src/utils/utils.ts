export function removeExtensionFromPath(path: string) {
	const t = path.lastIndexOf(".");
	// eslint-disable-next-line @typescript-eslint/no-deprecated
	return t === -1 || t === path.length - 1 || t === 0 ? path : path.substr(0, t);
}

export const validCharsRegex = new RegExp(/^[a-zA-Z;]*$/);

/**
 * Example: "A" => { code: "KeyA", shiftKey: true }
 */
export function mapCharacterToKeystroke(char: string): { code: string; shiftKey: boolean } {
	if (char.match(/^[a-z]$/)) {
		return {
			code: `Key${char.toUpperCase()}`,
			shiftKey: false,
		};
	} else if (char.match(/^[A-Z]$/)) {
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
			default:
				throw new Error(`Unexpected character: ${char}`);
		}
	}
}
