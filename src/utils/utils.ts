export function removeExtensionFromPath(path: string) {
	const t = path.lastIndexOf(".");
	// eslint-disable-next-line @typescript-eslint/no-deprecated
	return t === -1 || t === path.length - 1 || t === 0 ? path : path.substr(0, t);
}
