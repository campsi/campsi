'use strict';

const router = require('express').Router();
const async = require('async');
const {ObjectID} = require('mongodb');
const helpers = require('../modules/responseHelpers.js');
const path = require('path');
const http = require('http');
const stream = require('stream');
// const gm = require('gm');

const paginateCursor = require('../modules/paginateCursor');
const sortCursor = require('../modules/sortCursor');
const util = require('util');
/**
 *
 * @param {CampsiServer} server
 * @param {CampsiServerConfig~AssetsOptions} options
 * @param {Function} cb
 */
module.exports = function (server, options, cb) {

    const upload = require('multer')();
    /**
     * @type {Collection}
     */
    const assets = server.db.collection('__assets__');

    function getAssets(req, res) {
        const cursor = assets.find({});
        let result = {};
        cursor.count().then((count) => {
            result.count = count;
            let {skip, limit} = paginateCursor(cursor, req.query, {perPage: 5});
            result.hasNext = result.count > skip + limit;
            sortCursor(cursor, req);
            return cursor.toArray();
        }).then((docs) => {
            result.assets = docs;
            res.json(result)
        }).catch((err) => {
            console.error(err);
            res.json({});
        })
    }

    function getUploadForm(req, res) {
        res.send('<html><body>' +
            '<form action="/assets" method="post" enctype="multipart/form-data">' +
            '<input type="file" multiple="multiple" name="file"><br>' +
            '<input type="submit" name="submit"><br>' +
            '</form>' +
            '</body></html>')
    }


    function getAssetMetadata(req, res) {
        res.json(req.asset);
    }

    function sendLocalFile(req, res) {
        res.sendFile(path.join(options.storage.dataPath, req.params[0]));
    }

    function streamAsset(req, res) {

        const url = options.getAssetURL(req.asset);

        const newReq = http.request(url, function (newRes) {
            let headers = newRes.headers;
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
    }

    /**
     * @param {ExpressRequest} req
     * @param res
     */
    function deleteAsset(req, res) {
        options.deleteAsset(req.asset)
            .then(() => assets.deleteOne({_id: req.asset._id}))
            .then((result) => res.json(result))
            .catch((err) => helpers.error(res, err))
    }


    function postAssets(req, res) {
        async.each(req.files, (file, cb) => {

            function onError(err){
                console.error(err);
                file.error = true;
                cb();
            }

            function onSuccess(){
                file.stream.destroy();
                delete file.stream;
                delete file.fieldname;
                cb();
            }

            if (req.user) {
                file.createdBy = req.user.id;
            }
            file.createdAt = new Date();
            file.createdFrom = {
                origin: req.headers.origin,
                referer: req.headers.referer,
                ua: req.headers['user-agent']
            };

            options.storage.store(file).then((storageStream) => {
                file.stream.pipe(storageStream)
                    .on('uploadSuccess', onSuccess)
                    .on('uploadError', onError);
            }).catch(onError);
        }, () => {
            assets.insertMany(req.files).then((result) => {
                res.json(result.ops);
            });
        });
    }

    function paramAsset(req, res, next, id) {
        assets.findOne({_id: ObjectID(id)})
            .catch((err) => {
                console.error(err);
                helpers.notFound(res);
            })
            .then((asset) => {
                req.asset = asset;
                next();
            })
    }

    //noinspection JSUnresolvedFunction
    router.post('/', upload.array('file'), postAssets);
    router.get('/', getAssets);
    router.get('/local/*', sendLocalFile);
    router.get('/upload_form', getUploadForm);
    router.get('/:asset/metadata', getAssetMetadata);
    router.get('/:asset', streamAsset);
    router.delete('/:asset', deleteAsset);
    router.param('asset', paramAsset);
    cb(router);

};