const CampsiService = require('../../lib/service');
const forIn = require('for-in');
const local = require('./local');
const passportMiddleware = require('./passportMiddleware');
const passport = require('passport');
const helpers = require('../../lib/modules/responseHelpers');
const handlers = require('./handlers');

module.exports = class AuthService extends CampsiService {

    initialize() {
        const providers = this.options.providers;

        forIn(providers, (provider, providerName) => {
            provider.options.passReqToCallback = true;
            provider.options.scope = provider.scope;
            provider.name = providerName;
            if (providerName === 'local') {
                provider.callback = local.callback;
            }
            //noinspection JSUnresolvedFunction
            passport.use(
                providerName,
                new provider.Strategy(provider.options, passportMiddleware)
            );
        });

        this.router.use(function(req, res, next){
            req.authProviders = providers;
            next();
        });

        this.router.param('provider', function (req, res, next, id) {
            req.authProvider = providers[id];
            return (!req.authProvider) ? helpers.notFound(res) : next();
        });

        this.router.get('/providers', handlers.getProviders);
        this.router.get('/me', handlers.me);
        this.router.get('/logout', handlers.logout);

        if(providers.local) {
            this.router.use('/local', local.middleware(providers.local));
            this.router.post('/local/signup', local.signup);
            this.router.post('/local/signin', local.signin);
            this.router.post('/local/reset-password', local.resetPassword);
        }

        this.router.get('/:provider', handlers.initAuth);
        this.router.get('/:provider/callback', handlers.callback);

        return super.initialize();
    }
};
