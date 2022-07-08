import { getInput, setFailed } from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { kebabCaseIt } from "case-it";
import sendToBucketFolder from "../lib/send-to-bucket-folder.js";

async function main() {
	const GITHUB_TOKEN = getInput('GITHUB_TOKEN')
	const accessKeyId = getInput('ACCESS_KEY_ID')
	const secretAccessKey = getInput('SECRET_ACCESS_KEY')
	const distFolder = getInput('DIST_FOLDER')
	const octokit = getOctokit(GITHUB_TOKEN)

	const { data: { id: deployment_id } } = await octokit.rest.repos.createDeployment({
		owner: context.repo.owner,
		repo: context.repo.repo,
		ref: context.payload.pull_request.head.ref,
		environment: 'Preview',
		required_contexts: []
	})

	const deployDir = kebabCaseIt(`${context.sha.substring(0, 6)}-${context.repo.repo}`)

	sendToBucketFolder({
		bucket: 'hackathon-pr-previews',
		accessKeyId,
		secretAccessKey,
		distFolder,
		deployDir,
	})
		.then(async () => {
			await octokit.rest.repos.createDeploymentStatus({
				owner: context.repo.owner,
				repo: context.repo.repo,
				deployment_id,
				state: 'success',
				target_url: `https://${deployDir}.pr.voorhoede.nl`
			});
		})
		.catch(async () => {
			await octokit.rest.repos.createDeploymentStatus({
				owner: context.repo.owner,
				repo: context.repo.repo,
				deployment_id,
				state: 'error',
				target_url: `https://${deployDir}.pr.voorhoede.nl`
			});
		})


}

main().catch(err => setFailed(err.message))