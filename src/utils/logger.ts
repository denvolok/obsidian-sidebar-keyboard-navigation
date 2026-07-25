const loggerName = "Sidebar Keyboard Navigation";

export const Logger = {
	warn(message: string): void {
		console.warn(`[${loggerName}]: ${message}`);
	},
	error(message: string): void {
		console.error(`[${loggerName}]: ${message}`);
	},
};
