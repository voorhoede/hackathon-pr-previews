import { getInput, setFailed } from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { kebabCaseIt } from "case-it";
import sendToBucketFolder from "../lib/send-to-bucket-folder.js";
import {generate} from 'qrcode-terminal';

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
	const target_url = `https://${deployDir}.pr.voorhoede.nl`

	sendToBucketFolder({
		bucket: 'hackathon-pr-previews',
		accessKeyId,
		secretAccessKey,
		distFolder,
		deployDir,
	})
		.then(async () => {
			const deployStatus = octokit.rest.repos.createDeploymentStatus({
				owner: context.repo.owner,
				repo: context.repo.repo,
				deployment_id,
				state: 'success',
				target_url
			});
			generate(target_url, async function (qrcode) {
				await createComment(`\n${qrcode}\n[Preview this deployment](${target_url})`)
				await deployStatus
			});
		})
		.catch(async () => {
			await octokit.rest.repos.createDeploymentStatus({
				owner: context.repo.owner,
				repo: context.repo.repo,
				deployment_id,
				state: 'error',
				target_url
			});
		})

	/**
	 *
	 * @param body
	 * @returns {Promise<void>}
	 */
	async function createComment(body) {
		const commentIdentifier = '<!---HACKATHONPRPREVIEWS-->'
		const comment = commentIdentifier + body
		const { data: comments } = await octokit.rest.issues.listComments({
			owner: context.repo.owner,
			repo: context.repo.repo,
			issue_number: context.payload.pull_request.number,
		});
		const myComment = comments.find(comment => comment.body.startsWith(commentIdentifier));

		if (myComment) {
			octokit.rest.issues.updateComment({
				owner: context.repo.owner,
				repo: context.repo.repo,
				comment_id: myComment.id,
				body: comment,
			});
		} else {
			octokit.rest.issues.createComment({
				owner: context.repo.owner,
				repo: context.repo.repo,
				issue_number: context.payload.pull_request.number,
				body: comment,
			});
		}
	}
}

main().catch(err => setFailed(err.message))