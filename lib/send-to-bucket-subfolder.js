// Core
import { promises } from 'fs'
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
 * Convert file to S3 object including bucket, key (folder path/filename),
 * content type and contents
 *
 * @param  {String} subfolder
 * @param  {String} bucket
 * @return {Promise}
 */
function convertFileToS3Object(folder, bucket) {
	return async file => {
		try {
			const { body, mimeType } = await getFileBodyAndMime(file)
			const filename = file.replace(`${folder}/`, '')
			return {
				Bucket: bucket,
				Key: filename,
				ContentType: mimeType,
				Body: body
			}
		} catch(error) {
			throw new Error(`Could not convert file ${file} into S3 object\n=> ${error.message}`)
		}
	}
}

/**
 * Empty S3 bucket subfolder by deleting all keys one by one
 * Note: listObjectsV2 returns max 1000 objects, no pagination implemented yet
 *
 * @param {String} S3 Bucket name
 * @param {String} Subfolder name
 * @return {Promise}
 */
async function emptyBucketFolder(bucket, subfolder) {
	const objects = await s3.listObjectsV2({ Bucket: bucket }).promise()
	return Promise.all(
		objects.Contents.map(
			deleteS3Object
		)
	)

	function deleteS3Object(object) {
		return s3.deleteObject({
			Bucket: bucket,
			Key: object.Key
		}).promise()
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

export default async (accessKeyId, secretAccessKey, folder, bucket) => {
	initS3({
		accessKeyId,
		secretAccessKey,
	})
	await access(folder)
	await emptyBucketFolder(bucket, folder)
	return globby(`${folder}/**/*`)
		.then(files => files.map(convertFileToS3Object(folder, bucket)))
		.then(uploadS3Objects)
}
