import { setFailed, getInput } from '@actions/core';
import { getOctokit, context } from '@actions/github';

async function main() {
	const GITHUB_TOKEN = getInput('GITHUB_TOKEN');
	const octokit = getOctokit(GITHUB_TOKEN)

	const commentIdentifier = '<!---HACKATHONPRPREVIEWS-->'

	const comment = commentIdentifier + process.env.GITHUB_REF

	const {data: comments} = await octokit.rest.issues.listComments({
		owner: context.repo.owner,
		repo: context.repo.repo,
		issue_number: process.env.PR_NUMBER,
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
			issue_number: process.env.PR_NUMBER,
			body: comment,
		});
	}
}

main().catch(err => setFailed(err.message))