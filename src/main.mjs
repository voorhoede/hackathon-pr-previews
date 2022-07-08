import { getInput, setFailed } from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { kebabCaseIt } from "case-it";

async function main() {
	const GITHUB_TOKEN = getInput('GITHUB_TOKEN')
	const octokit = getOctokit(GITHUB_TOKEN)

	const commentIdentifier = '<!---HACKATHONPRPREVIEWS-->'

	console.log(await octokit.rest.repos.createDeployment({
		owner: context.repo.owner,
		repo: context.repo.repo,
		ref: context.payload.pull_request.head.ref,
		environment: 'Preview',
		required_contexts: []
	}));

	const deploymentName = commentIdentifier + kebabCaseIt(`${context.repo.repo}-${context.payload.pull_request.head.ref}-${context.payload.pull_request.number}`)

	const {data: comments} = await octokit.rest.issues.listComments({
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
			body: deploymentName,
		});
	} else {
		octokit.rest.issues.createComment({
			owner: context.repo.owner,
			repo: context.repo.repo,
			issue_number: context.payload.pull_request.number,
			body: deploymentName,
		});
	}
}

main().catch(err => setFailed(err.message))