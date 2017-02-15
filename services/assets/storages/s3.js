const aws = require('aws-sdk');
const AssetStorage = require('../storage');
const {PassThrough} = require('stream');

class S3AssetStorage extends AssetStorage {

    constructor(options) {
        super(options);
        aws.config.update({
            accessKeyId: this.options.credentials.accessKeyId,
            secretAccessKey: this.options.credentials.secretAccessKey,
            region: this.options.credentials.region
        });
    }

    get dataPath() {
        return this.options.dataPath;
    }

    store(file) {
        return new Promise((resolve) => {
            resolve(this.createPassThrough(file));
        });
    }

    createPassThrough(file) {
        const s3 = new aws.S3({params: {Bucket: this.options.bucket}});
        const bucket = this.options.bucket;
        let buffer = new Buffer(0);
        let len = 0;
        return new PassThrough().on('data', (chunk) => {
            len += chunk.length;
            buffer = Buffer.concat([buffer, chunk], len);
        }).on('finish', function streamBuffered() {
            const self = this;
            s3.upload({
                Bucket: bucket,
                Key: Date.now().toString() + '-' + file.originalName,
                ContentType: 'application/octet-stream',
                ContentLength: file.size,
                Body: buffer
            }).on('httpUploadProgress', function (ev) {
                if (ev.total) file.uploadedSize = ev.total;
            }).send((err, data) => {
                if (err) {
                    return self.emit('uploadError', err);
                }
                file.s3 = data;
                file.url = data.Location;
                self.emit('uploadSuccess', file);
            });
        });
    }

    deleteAsset(file) {
        return new Promise((resolve, reject) => {
            this.s3.deleteObject({
                Bucket: this.options.bucket,
                Key: file.key
            }, (err) => err ? reject(err) : resolve());
        });
    }
}

module.exports = S3AssetStorage;
