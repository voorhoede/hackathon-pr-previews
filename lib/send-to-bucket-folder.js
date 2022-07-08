// Core
import { promises } from 'fs'
import { join } from 'path'
const { access, readFile } = promises

// NPM
import aws from 'aws-sdk'
import { globby } from 'globby'
import mime from 'mime'

// Shared instance
let s3

// S3 defaults
const S3_DEFAULTS = {
	accessKeyId: null,
	secretAccessKey: null,
	region: 'eu-central-1', // Frankfurt
}

/**
 * Initialize S3 client. Needs AWS credentials
 * @param  {Object} params
 */
function initS3(params = {}) {
	if (s3) return
	const options = Object.assign({}, S3_DEFAULTS, params)
	s3 = new aws.S3(options)
}

/**
 * Gets mimetype for a file path
 *
 * @param  {String} filePath
 * @return {Promise}
 */
async function getFileBodyAndMime(filePath) {
	return readFile(filePath)
		.then(body => ({
			body,
			mimeType: mime.getType(filePath) || 'application/octet-stream'
		}))
}

/**
 * Convert file to S3 object including bucket, key (folder path/filename, where
 * the folder path uses the sha), content type and contents
 *
 * @param  {String} bucket
 * @param  {String} sha
 * @return {Promise}
 */
function convertFileToS3Object(distFolder, bucket, commitSHA) {
	return async file => {
		try {
			const { body, mimeType } = await getFileBodyAndMime(file)
			const filename = file.replace(`${distFolder}/`, '')
			return {
				Bucket: bucket,
				Key: join(commitSHA, filename),
				ContentType: mimeType,
				Body: body
			}
		} catch(error) {
			throw new Error(`Could not convert file ${file} into S3 object\n=> ${error.message}`)
		}
	}
}

/**
 * Upload objects to our bucket
 *
 * @param {Object[]}
 * @return {Promise}
 */
function uploadS3Objects(objects) {
	return Promise.all(objects.map(async object => s3.putObject(await object).promise()))
}

export default async (options) => {
	const { accessKeyId, secretAccessKey, distFolder, bucket, commitSHA } = options
	initS3({
		accessKeyId,
		secretAccessKey,
	})
	await access(distFolder)
	return globby(`${distFolder}/**/*`)
		.then(files => files.map(convertFileToS3Object(distFolder, bucket, commitSHA)))
		.then(uploadS3Objects)
}
