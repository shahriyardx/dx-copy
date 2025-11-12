/**
 * dx-copy CLI with interactive prompts using Enquirer
 *
 * Usage:
 *   dx-copy <source> <destination> [--preserve|-p]
 *
 * If source/destination are omitted, prompts will ask for them.
 */

import fs from "node:fs"
import path from "node:path"
import {
	cleanup,
	ensureGitAvailable,
	interactivePromptDefault,
	parseArgsRaw,
	run,
} from "./utils"

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

async function main() {
	const { positional, preserve: preserveFlag } = parseArgsRaw()

	let source: string | undefined
	let destination: string | undefined
	let preserve = preserveFlag

	if (positional.length < 2) {
		console.log(
			`ℹ️  Running interactive mode — answer a few questions.\n ${asciiLogo}`,
		)
		try {
			const answers = await interactivePromptDefault()
			source = answers.source
			destination = answers.destination
			preserve = answers.preserve
		} catch {
			console.log("❌ Cancelled")
			return
		}
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

main().catch((err) => {
	console.error(
		"❌ Unexpected error:",
		err instanceof Error ? err.message : String(err),
	)
	process.exit(1)
})
