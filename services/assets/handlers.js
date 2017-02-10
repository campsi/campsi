const async = require('async');
const path = require('path');
const helpers = require('../../lib/modules/responseHelpers');
const createObjectID = require('../../lib/modules/createObjectID');
const paginateCursor = require('../../lib/modules/paginateCursor');
const sortCursor = require('../../lib/modules/sortCursor');
const http = require('http');


function coll(req) {
    return req.db.collection('__assets__');
}

module.exports.postAssets = function postAssets(req, res) {
    console.info('post assets');
    const assets = coll(req);

    if (!req.files || !req.files.length) {
        return res.json([]);
    }

    async.each(req.files, (file, cb) => {

        const storage = req.assetsOptions.getStorage(file);

        function onError(err) {
            console.error(err);
            file.error = true;
            cb();
        }

        function onSuccess() {
            file.stream.destroy();
            delete file.stream;
            delete file.fieldname;
            cb();
        }

        if (req.user) {
            file.createdBy = req.user._id;
        }

        file.createdAt = new Date();
        file.createdFrom = {
            origin: req.headers.origin,
            referer: req.headers.referer,
            ua: req.headers['user-agent']
        };

        file.storage = storage.options.name;

        storage.store(file).then((storageStream) => {
            file.stream.pipe(storageStream)
                .on('uploadSuccess', onSuccess)
                .on('uploadError', onError);
        }).catch(onError);
    }, () => {
        assets.insertMany(req.files).then((result) => {
            res.json(result.ops);
        });
    });
};

module.exports.getAssets = function getAssets(req, res) {
    const cursor = coll(req).find({});
    let result = {};
    cursor.count().then((count) => {
        result.count = count;
        let {skip, limit} = paginateCursor(cursor, req.query, {perPage: 100});
        result.hasNext = result.count > skip + limit;
        sortCursor(cursor, req);
        return cursor.toArray();
    }).then((docs) => {
        result.assets = docs;
        res.json(result);
    }).catch((err) => {
        console.error(err);
        res.json({});
    });
};

module.exports.sendLocalFile = function sendLocalFile(req, res) {
    res.sendFile(path.join(req.assetsOptions.storages.local.dataPath, req.params[0]));
};

module.exports.getStorage = function (req, res, next) {
    req.storage = req.assetsOptions.storages[req.asset.storage];
    if (!req.storage) {
        return helpers.error(res, {
            message: 'undefined storage',
            asset: req.asset
        });
    }
    next();
};

module.exports.streamAsset = function streamAsset(req, res) {
    const url = req.storage.getAssetURL(req.asset);
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
};

module.exports.getUploadForm = function getUploadForm(req, res) {
    res.send('<html><body>' +
        '<form action="/assets" method="post" enctype="multipart/form-data">' +
        '<input type="file" multiple="multiple" name="file"><br>' +
        '<input type="submit" name="submit"><br>' +
        '</form>' +
        '</body></html>');
};


module.exports.getAssetMetadata = function getAssetMetadata(req, res) {
    res.json(req.asset);
};


/**
 * @param {ExpressRequest} req
 * @param res
 */
module.exports.deleteAsset = function deleteAsset(req, res) {
    req.storage.deleteAsset(req.asset)
        .then(() => coll(req).deleteOne({_id: req.asset._id}))
        .then((result) => res.json(result))
        .catch((err) => helpers.error(res, err));
};

module.exports.paramAsset = function (req, res, next, id) {
    coll(req).findOne({_id: createObjectID(id)}).then((asset) => {
        if (!asset) {
            return helpers.notFound(res);
        }
        req.asset = asset;
        next();
    }).catch((err) => {
        console.error(err);
        helpers.notFound(res);
    });
};