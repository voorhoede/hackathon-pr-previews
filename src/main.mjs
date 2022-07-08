import { getInput, setFailed } from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { kebabCaseIt } from "case-it";

async function main() {
	const GITHUB_TOKEN = getInput('GITHUB_TOKEN')
	const octokit = getOctokit(GITHUB_TOKEN)

	const { data: { id: deployment_id } } = await octokit.rest.repos.createDeployment({
		owner: context.repo.owner,
		repo: context.repo.repo,
		ref: context.payload.pull_request.head.ref,
		environment: 'Preview',
		required_contexts: []
	})

	const deploymentName = kebabCaseIt(`${context.sha}-${context.repo.repo}-${context.payload.pull_request.head.ref}`)

	await octokit.rest.repos.createDeploymentStatus({
		owner: context.repo.owner,
		repo: context.repo.repo,
		deployment_id,
		state: 'success',
		target_url: `https://${deploymentName}.pr.voorhoede.nl`
	});
}

main().catch(err => setFailed(err.message))