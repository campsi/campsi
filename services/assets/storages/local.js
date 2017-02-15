const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const stream = require('stream');
const AssetStorage = require('../storage');

class LocalAssetStorage extends AssetStorage {

    constructor(options) {
        super(options);
    }

    get dataPath() {
        return this.options.dataPath;
    }

    store(file) {
        return this.destination()
            .then((destination) => file.destination = destination)
            .then(() => this.filename(file))
            .then((filename) => {
                file.path = path.join(file.destination.abs, filename);
                file.url = this.options.baseUrl + '/local/' + file.destination.rel + '/' + filename;
                return file;
            })
            .then(() => {
                const writeStream = fs.createWriteStream(file.path);
                return new stream.PassThrough()
                    .on('data', (chunk) => {
                        writeStream.write(chunk);
                    }).on('finish', function () {
                        writeStream.destroy();
                        this.emit('uploadSuccess');
                    }).on('error', function(){
                        writeStream.destroy();
                        this.emit('uploadError');
                    });
            });
    }

    filename(file) {
        return new Promise((resolve) => {
            fs.stat(path.join(file.destination.abs, file.originalName), function (err) {
                resolve((err && err.code === 'ENOENT')
                    ? file.originalName
                    : Date.now() + '-' + file.originalName
                );
            });
        });
    }

    destination() {
        const now = new Date();
        let month = now.getMonth() + 1;
        month = (month < 10) ? '0' + month : month.toString();
        const relativePath = path.join(now.getFullYear().toString(), month);
        const asbolutePath = path.join(this.options.dataPath, relativePath);
        return new Promise((resolve) => {
            mkdirp(asbolutePath, () => resolve({
                rel: relativePath,
                abs: asbolutePath
            }));
        });
    }

    deleteAsset(file) {
        return new Promise((resolve, reject) => {
            fs.unlink(file.path, (err) => (err) ? reject(err) : resolve());
        });
    }
}

module.exports = LocalAssetStorage;
