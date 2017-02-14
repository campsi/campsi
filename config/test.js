const path = require('path');
const LocalAssetStorage = require('../services/assets/storages/local');
const host = 'http://localhost:3000';
const storageProviders = {
    local: new LocalAssetStorage({
        name: 'local',
        title: 'Serveur',
        dataPath: path.join(__dirname, '..', 'data'),
        baseUrl: host + '/assets'
    })
};

module.exports = {
    port: 3000,
    host: host,
    title: 'Test Arezzo',
    campsi: {
        mongoURI: 'mongodb://localhost:27017/relationships',
    },
    services: {
        users: {
            title: 'Utilisateurs',
            kind: 'users'
        },
        auth: {
            title: 'Authentification',
            kind: 'auth',
            // todo users: 'users'
            options: {
                providers: {
                    local: require('../services/auth/providers/local')({
                        baseUrl: host + '/auth',
                        salt: 'CNDygyeFC6536964425994'
                    })
                }
            }
        },
        assets: {
            title: 'Médias',
            kind: 'assets',
            options: {
                roles: ['public', 'admin'],
                order: ['local'],
                fallback: 'local',
                //todo copy / backup
                getStorage: () => storageProviders.local,
                storages: storageProviders
            }
        },
        docs: {
            title: 'Contenus',
            kind: 'docs',
            options: {
                schema: require('../examples/relationships.json')
            }
        }
    }
};