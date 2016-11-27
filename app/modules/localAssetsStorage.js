const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const diskStorage = require('multer').diskStorage;

module.exports = function (options) {
    return {
        dataPath: options.dataPath,
        /**
         *
         * @returns {DiskStorage}
         */
        getStorage: function () {
            return diskStorage({
                destination: function (req, file, cb) {
                    const now = new Date();
                    let month = now.getMonth() + 1;
                    month = (month < 10) ? '0' + month : month.toString();
                    file.relativePath = path.join(now.getFullYear().toString(), month);
                    file.asbolutePath = path.join(options.dataPath, file.relativePath);
                    mkdirp(file.asbolutePath, ()=> cb(null, file.asbolutePath));
                },
                filename: function (req, file, cb) {
                    fs.stat(path.join(file.asbolutePath, file.originalname), function (err) {
                        cb(null, (err && err.code === 'ENOENT')
                            ? file.originalname
                            : Date.now() + '-' + file.originalname
                        );
                    });
                }
            })
        },

        /**
         *
         * @param {AssetMetadata} metadata
         * @returns {string}
         */
        getAssetURL: function (metadata) {
            return options.baseUrl + '/local/' + metadata.relativePath + '/' + metadata.filename;
        },

        /**
         *
         * @param {AssetMetadata} metadata
         * @returns {Promise}
         */
        deleteAsset: function (metadata) {
            return new Promise((resolve, reject)=> {
                fs.unlink(metadata.path, (err)=> {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            });
        }

    }
};

