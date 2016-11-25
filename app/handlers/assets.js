'use strict';

const router = require('express').Router();

module.exports = function (server, cb) {

    const upload = require('multer')(server.config.multerOptions);

    router.get('/', (req, res)=> {
        res.send('<html><body>' +
            '<form action="/assets" method="post" enctype="multipart/form-data">' +
            '   <input type="file" name="file"><br>' +
            '   <input type="file" name="file"><br>' +
            '   <input type="submit" name="submit"><br>' +
            '</form>' +
            '</body></html>')
    });

    //noinspection JSUnresolvedFunction
    router.post('/', upload.array('file'), (req, res)=> {
        res.json(req.files);
    });

    cb(router);

};