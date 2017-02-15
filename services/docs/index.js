const CampsiService = require('../../lib/service');
const param = require('./param');
const handlers = require('./handlers');
const async = require('async');
const campsi = require('campsi-core');
const forIn = require('for-in');
require('campsi-base-components');

module.exports = class DocsService extends CampsiService {
    initialize() {

        const schema = this.options.schema;
        const db = this.db;

        this.router.use('/', (req, res, next) => {
            req.schema = schema;
            next();
        });
        this.router.param('resource', param(schema));
        this.router.get('/', handlers.getResources);
        this.router.get('/:resource', handlers.getDocs);
        this.router.get('/:resource/:id/state', handlers.getDocState);
        this.router.get('/:resource/:id/:state', handlers.getDoc);
        this.router.get('/:resource/:id', handlers.getDoc);
        this.router.post('/:resource/:state', handlers.postDoc);
        this.router.post('/:resource', handlers.postDoc);
        this.router.put('/:resource/:id/state', handlers.putDocState);
        this.router.put('/:resource/:id/:state', handlers.putDoc);
        this.router.put('/:resource/:id', handlers.putDoc);
        this.router.delete('/:resource/:id', handlers.delDoc);
        this.router.delete('/:resource/:id/:state', handlers.delDoc);

        return new Promise((resolve) => {
            async.eachOf(schema.resources, function (resource, name, cb) {
                Object.assign(resource, schema.types[resource.type]);
                campsi.create('form', {
                    options: {fields: resource.fields},
                    context: new campsi.context()
                }, (component) => {
                    resource.model = component;
                    resource.collection = db.collection(name);
                    cb();
                });
            }, resolve);
        });
    }

    describe() {
        let desc = super.describe();
        desc.resources = {};
        desc.types = this.options.schema.types;
        forIn(this.options.schema.resources, (resource, path)=>{
            desc.resources[path] = {
                label: resource.label,
                name: resource.path,
                type: resource.type,
                fields: resource.fields
            };
        });
        return desc;
    }
};
