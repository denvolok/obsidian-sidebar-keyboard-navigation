import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import eslint from "@eslint/js";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
	{
		files: ["**/*.ts"],
		languageOptions: {
			globals: globals.browser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		extends: [
			eslint.configs.recommended,
			prettier,
			tseslint.configs.strictTypeChecked,
			tseslint.configs.stylisticTypeChecked,
		],
		rules: {
			"@typescript-eslint/restrict-template-expressions": ["warn", {
				allowNumber: true,
			}],
		}
	},
	...obsidianmd.configs.recommended,
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.mjs",
		"version-bump.mjs",
		"versions.json",
		"main.js",
	]),
]);
