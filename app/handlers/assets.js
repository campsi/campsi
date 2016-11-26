'use strict';

const router = require('express').Router();
const async = require('async');
const exif = require('fast-exif');
const getImageSize = require('image-size');
const {ObjectID} = require('mongodb');
const helpers = require('../modules/responseHelpers.js');
const path = require('path');
const request = require('request');
const http = require('http');

/**
 *
 * @param {CampsiServer} server
 * @param {CampsiServerConfig~AssetsOptions} options
 * @param cb
 */
module.exports = function (server, options, cb) {

    const upload = require('multer')(options.multerOptions);
    /**
     * @type {Collection}
     */
    const assets = server.db.collection('__assets__');

    router.get('/upload_form', (req, res)=> {
        res.send('<html><body>' +
            '<form action="/assets" method="post" enctype="multipart/form-data">' +
            '<input type="file" multiple="multiple" name="file"><br>' +
            '<input type="submit" name="submit"><br>' +
            '</form>' +
            '</body></html>')
    });

    router.get('/', (req, res)=> {
        assets.find({})
            .toArray()
            .then((result) => res.json(result))
            .catch((err)=> {
                console.error(err);
                res.json({});
            })
    });



    router.get('/local/*', (req, res)=> {
        res.sendFile(path.join(options.dataPath, req.params[0]));
    });

    router.get('/:asset', (req, res)=> {

        const url = options.getAssetURL(req.asset);

        const newReq = http.request(url, function (newRes) {
            var headers = newRes.headers;
            headers['Content-Type'] = req.asset.mimetype;
            headers['Content-Length'] = req.asset.size;
            res.writeHead(newRes.statusCode, headers);
            newRes.pipe(res);
        }).on('error', function (err) {
            console.error(err);
            res.statusCode = 500;
            res.end();
        });

        req.pipe(newReq);
    });

    router.put('/:asset', (req, res)=> {

    });

    router.delete('/:asset', (req, res)=> {

    });

    router.param('asset', (req, res, next, id)=> {
        assets.findOne({_id: ObjectID(id)})
            .catch((err)=> {
                console.error(err);
                helpers.notFound(res);
            })
            .then((asset)=> {
                console.info(asset);
                req.asset = asset;
                next();
            })
    });

    //noinspection JSUnresolvedFunction
    router.post('/', upload.array('file'), (req, res)=> {

        async.each(req.files, (file, cb)=> {

            delete file.destination;
            delete file.fieldname;

            file.createdBy = req.user ? req.user.id : null;
            file.createdAt = new Date();
            if (!file.url) {
                file.url = options.getAssetURL(file);
            }
            if (!file.mimetype.startsWith('image')) {
                return cb();
            }

            getImageSize(file.path, (err, dimensions)=> {
                file.dimensions = dimensions;
                exif.read(file.path).then((exifData)=> {
                    file.metada = exifData;
                    cb();
                }).catch((err)=> {
                    console.error(err.message);
                    cb();
                })
            });
        }, ()=> {
            assets.insertMany(req.files).then((result)=> {
                res.json(result.ops);
            });
        });

    });

    cb(router);

};