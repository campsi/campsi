const path = require('path');

module.exports = {
    port: 3000,
    schema: path.join(__dirname, '..', 'schema.json'),
    mongoURI: 'mongodb://localhost:27017'
};