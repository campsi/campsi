const CampsiService = require('../../service');
const handlers = require('./handlers');
const multer = require('multer');

module.exports = class AssetsService extends CampsiService {

    initialize() {
        this.router.use((req, res, next) => {
            req.assetsOptions = this.options;
            next();
        });
        this.router.param('asset', handlers.paramAsset, handlers.getStorage);
        this.router.post('/', multer().array('file'), handlers.postAssets);
        this.router.get('/', handlers.getAssets);
        this.router.get('/local/*', handlers.sendLocalFile);
        this.router.get('/upload_form', handlers.getUploadForm);
        this.router.get('/:asset/metadata', handlers.getAssetMetadata);
        this.router.get('/:asset', handlers.streamAsset);
        this.router.delete('/:asset', handlers.deleteAsset);
        return super.initialize();
    }

};