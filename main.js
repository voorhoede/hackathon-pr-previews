const github = require('@actions/github');
const core = require('@actions/core');

async function run() {
	// This should be a token with access to your repository scoped in as a secret.
	// The YML workflow will need to set myToken with the GitHub Secret Token
	// GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
	// https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
	const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');

	const octokit = github.getOctokit(GITHUB_TOKEN)

	// You can also pass in additional options as a second parameter to getOctokit
	// const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});

	const { data: pullRequest } = await octokit.rest.pulls.get({
		owner: 'octokit',
		repo: 'rest.js',
		pull_number: 123,
		mediaType: {
			format: 'diff'
		}
	});

	console.log(pullRequest);
}

run();