const CampsiService = require('../../lib/service');
const handlers = require('./handlers');
module.exports = class UsersService extends CampsiService {
    initialize() {
        this.router.get('/invitations/:invitation', handlers.getInvitation);
        this.router.post('/invitations', handlers.createInvitation);
        this.router.get('/', handlers.listUsers);
        this.router.get('/:user', handlers.getUser);
        return super.initialize();
    }
};

