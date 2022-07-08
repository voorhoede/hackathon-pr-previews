#!/usr/bin/env node

import sendToBucketSubFolder from './lib/send-to-bucket-subfolder.js'

sendToBucketSubFolder('AKIAUGWRCUSVQFLRM6XN', '8Z7XfGBS4Lci5Rg+GuOsyaU/z4iVAkSEGdi1vCcK', 'dist', 'hackathon-pr-previews')
	.then(console.log)
	.catch(console.error)
