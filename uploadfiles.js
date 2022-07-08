#!/usr/bin/env node

import sendToBucketFolder from './lib/send-to-bucket-folder.js'

sendToBucketFolder({
	accessKeyId: '',
	secretAccessKey: '',
	distFolder: 'dist',
	bucket: 'hackathon-pr-previews',
	commitSHA: '',
})
	.then(console.log)
	.catch(console.error)
