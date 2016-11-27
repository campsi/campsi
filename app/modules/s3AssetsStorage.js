'use strict';

const aws = require('aws-sdk');
const multerS3 = require('multer-s3');

/**
 * @name S3Credentials
 * @property {String} accessKeyId
 * @property {String} secretAccessKey
 *
 */
/**
 *
 * @param {Object} options
 * @param {String} options.bucket
 * @param {S3Credentials} options.credentials
 * @returns {{getStorage: getStorage}}
 */
module.exports = function s3AssetsStorage(options) {

    aws.config.update(options.credentials);

    const multerStorage = multerS3({
        s3: new aws.S3(),
        bucket: options.bucket,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        /**
         *
         * @param {ExpressRequest} req
         * @param {AssetMetadata} file
         * @param {Function} cb
         */
        metadata: function (req, file, cb) {
            cb(null, {});
        },
        /**
         *
         * @param {ExpressRequest} req
         * @param {AssetMetadata} file
         * @param {Function} cb
         */
        key: function (req, file, cb) {
            let key = Date.now().toString() + '-' + file.originalname;
            console.dir(file);
            console.info(key);
            cb(null, key)
        }
    });

    return {
        getAssetURL: function (metadata) {
            return metadata.location;
        },
        deleteAsset: function (metadata) {
            return new Promise((resolve, reject)=> {
                multerStorage._removeFile(null, metadata, (err)=> {
                    if (err) {
                        return reject(err);
                    }
                    return (resolve());
                })
            });
        },
        getStorage: function () {
            return multerStorage;
        }
    }
};

