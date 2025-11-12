import fs from "node:fs"
import enquirer from "enquirer"
import { spawnSync } from "node:child_process"

const { prompt } = enquirer as any

type ExecResult = { code: number; stdout: string; stderr: string }

export const parseArgsRaw = () => {
	const raw = process.argv.slice(2)
	const flags = raw.filter((a) => a.startsWith("-"))
	const positional = raw.filter((a) => !a.startsWith("-"))
	const preserve = raw.includes("--preserve") || raw.includes("-p")

	return { raw, positional, flags, preserve }
}

export const ensureGitAvailable = () => {
	const res = spawnSync("git", ["--version"], { encoding: "utf-8" })
	if (res.status !== 0) {
		console.error("❌ Git is not installed or not in PATH.")
		process.exit(1)
	}
}

export const run = (cmd: string[], cwd?: string): ExecResult => {
	const res = spawnSync(cmd[0], cmd.slice(1), {
		cwd,
		encoding: "utf-8",
		stdio: ["pipe", "pipe", "pipe"],
	})
	return {
		code: res.status ?? 0,
		stdout: res.stdout ?? "",
		stderr: res.stderr ?? "",
	}
}

export const cleanup = (dir: string, preserve: boolean) => {
	if (preserve) {
		console.log(`📁 Preserved local clone at: ${dir}`)
		return
	}
	try {
		fs.rmSync(dir, { recursive: true, force: true })
		console.log("🧹 Cleaned up local directory.")
	} catch (err) {
		console.warn("⚠️ Failed to clean up:", (err as Error).message)
	}
}

function exit() {
	prompt.cl
}

export const interactivePromptDefault = async () => {
	process.stdin.on("keypress", (_, key) => {
		if (key.name === "escape") {
			exit()
		}
	})
	const responses = await prompt([
		{
			type: "input",
			name: "source",
			message: "Source repository URL:",
			validate(value: string) {
				return value.length > 0
					? true
					: "Please provide a source repository URL"
			},
		},
		{
			type: "input",
			name: "destination",
			message: "Destination repository URL:",
			validate(value: string) {
				return value.length > 0
					? true
					: "Please provide a destination repository URL"
			},
		},
		{
			type: "confirm",
			name: "preserve",
			message: "Preserve the local clone after copying?",
			initial: false,
		},
	])

	return responses
}
