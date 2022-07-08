const {setFailed} = require('@actions/core')
const {getOctokit, context} = require('@actions/github');

async function main() {
	const octokit = getOctokit(process.env.GITHUB_TOKEN);

	const commentIdentifier = '<!---HACKATHONPRPREVIEWS-->'

	const comment = commentIdentifier + `Hello commit`

	const {data: comments} = await octokit.issues.listComments({
		owner: context.repo.owner,
		repo: context.repo.repo,
		issue_number: process.env.PR_NUMBER,
	});
	const myComment = comments.find(comment => comment.body.startsWith(commentIdentifier));
	if (myComment) {
		octokit.issues.updateComment({
			owner: context.repo.owner,
			repo: context.repo.repo,
			comment_id: myComment.id,
			body: comment,
		});
	} else {
		octokit.issues.createComment({
			owner: context.repo.owner,
			repo: context.repo.repo,
			issue_number: process.env.PR_NUMBER,
			body: comment,
		});
	}
}

main().catch(err => setFailed(err.message))