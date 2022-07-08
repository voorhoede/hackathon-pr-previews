import { setFailed, getInput } from '@actions/core';
import { getOctokit, context } from '@actions/github';

async function main() {
	const GITHUB_TOKEN = getInput('GITHUB_TOKEN');
	const octokit = getOctokit(GITHUB_TOKEN);
	console.log({context})
}

main().catch(err => setFailed(err.message))