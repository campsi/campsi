module.exports = {
    // Application configuration
    port: 3000,
    campsi: {
        title: 'Test',
        publicURL: 'http://localhost:3000',
        mongo: {
            host: 'localhost',
            port: 27017,
            database: 'test-campsi'
        }
    },
    campsiPrefix: {
        title: 'Test',
        publicURL: 'http://localhost:3000/v1',
        mongo: {
            host: 'localhost',
            port: 27017,
            database: 'test-campsi'
        }
    },
    services: {
        'test': {

        }
    }
};
