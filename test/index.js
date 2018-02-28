process.env.NODE_CONFIG_DIR = './config';
process.env.NODE_ENV = 'test';

const CampsiServer = require('../lib/server');
const CampsiService = require('../lib/service');
const config = require('config');
const debug = require('debug')('campsi:test');

class Test extends CampsiService {
  initialize () {
    this.router.get('/', (req, res) => {
      return res.json('OK !');
    });
    return Promise.resolve();
  }
}

let campsi = new CampsiServer(config.campsi);

campsi.mount('test', new Test(config.services.test));

campsi.on('campsi/ready', () => {
  debug('ready');
  campsi.listen(config.port);
});

campsi.on('auth/local/passwordResetTokenCreated', user => {
  debug('passwordResetTokenCreated', user.identities.local.passwordResetToken);
});

process.on('uncaughtException', function () {
  debug('uncaughtException');
});

process.on('unhandledRejection', (reason, p) => {
  debug('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

campsi.start()
  .catch((error) => {
    debug(error);
  });
