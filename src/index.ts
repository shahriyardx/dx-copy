#!/usr/bin/env node
/**
 * gh-copy CLI with interactive prompts using Enquirer
 *
 * Usage:
 *   gh-copy <source> <destination> [--preserve|-p]
 *
 * If source/destination are omitted, prompts will ask for them.
 */

import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import enquirer from "enquirer"
// biome-ignore lint/suspicious/noExplicitAny: commonjs to esmodule
const { prompt } = enquirer as any

type ExecResult = { code: number; stdout: string; stderr: string }

const asciiLogo = `
       ░██                                                           
       ░██                                                           
 ░████████ ░██    ░██     ░███████   ░███████  ░████████  ░██    ░██ 
░██    ░██  ░██  ░██     ░██    ░██ ░██    ░██ ░██    ░██ ░██    ░██ 
░██    ░██   ░█████      ░██        ░██    ░██ ░██    ░██ ░██    ░██ 
░██   ░███  ░██  ░██     ░██    ░██ ░██    ░██ ░███   ░██ ░██   ░███ 
 ░█████░██ ░██    ░██     ░███████   ░███████  ░██░█████   ░█████░██ 
                                               ░██               ░██ 
                                               ░██         ░███████ 

Copy a GitHub repo to another repo interactively or via CLI
--------------------------------------------------------------------
`

function parseArgsRaw() {
	const raw = process.argv.slice(2)
	const flags = raw.filter((a) => a.startsWith("-"))
	const positional = raw.filter((a) => !a.startsWith("-"))
	const preserve = raw.includes("--preserve") || raw.includes("-p")
	return { raw, positional, flags, preserve }
}

function ensureGitAvailable() {
	const res = spawnSync("git", ["--version"], { encoding: "utf-8" })
	if (res.status !== 0) {
		console.error("❌ Git is not installed or not in PATH.")
		process.exit(1)
	}
}

function run(cmd: string[], cwd?: string): ExecResult {
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

function cleanup(dir: string, preserve: boolean) {
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

async function interactivePromptDefault() {
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

async function main() {
	const { positional, preserve: preserveFlag } = parseArgsRaw()

	let source: string | undefined
	let destination: string | undefined
	let preserve = preserveFlag

	if (positional.length < 2) {
		console.log(
			`ℹ️  Running interactive mode — answer a few questions.\n ${asciiLogo}`,
		)
		const answers = await interactivePromptDefault()
		source = answers.source
		destination = answers.destination
		preserve = answers.preserve
	} else {
		source = positional[0]
		destination = positional[1]
	}

	if (!source || !destination) {
		console.error("❌ Source and destination are required.")
		console.error("Usage: gh-copy <source> <destination> [--preserve|-p]")
		process.exit(1)
	}

	ensureGitAvailable()

	// Derive repo folder name (replace . with - for safety)
	const repoName = path
		.basename(source.replace(/\/+$/, ""))
		.replace(/\.git$/, "")
		.replace(/\./g, "-")

	console.log(`🔄 Cloning ${source} ...`)
	const res = run(["git", "clone", source])
	if (res.code !== 0) {
		console.error("❌ Clone failed:", res.stderr || res.stdout)
		process.exit(1)
	}

	const repoPath = path.join(process.cwd(), repoName)
	if (!fs.existsSync(repoPath)) {
		console.error("❌ Cloned folder not found. Expected:", repoPath)
		process.exit(1)
	}

	console.log(`🔁 Setting remote to destination...`)
	run(["git", "remote", "set-url", "origin", destination], repoPath)

	console.log(`🚀 Pushing all branches and tags to ${destination} ...`)
	const pushBranches = run(["git", "push", "--all", "origin"], repoPath)
	const pushTags = run(["git", "push", "--tags", "origin"], repoPath)

	if (pushBranches.code !== 0 || pushTags.code !== 0) {
		console.error("⚠️ Push failed:")
		console.error(pushBranches.stderr || pushBranches.stdout)
		console.error(pushTags.stderr || pushTags.stdout)
	} else {
		console.log("✅ Repository copied successfully!")
	}

	cleanup(repoPath, preserve)
}

// Run main
main().catch((err) => {
	console.error(
		"❌ Unexpected error:",
		err instanceof Error ? err.message : String(err),
	)
	process.exit(1)
})
