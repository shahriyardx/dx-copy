import { defineConfig } from "tsup"

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	outDir: "dist",
	target: "node20",
	splitting: false,
	sourcemap: false,
	clean: true,
	dts: true,
	shims: false,
	banner: {
		js: "#!/usr/bin/env node",
	},
})
