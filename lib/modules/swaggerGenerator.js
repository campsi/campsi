/*const util = require('util');
const parseJSON = require('./parseJSON');*/

/*function generateSwagger(schema) {

    let root = {
        swagger: '2.0',
        info: {
            title: schema.title,
            version: 'v1'
        },
        paths: {}
    };

    for (var name in schema.resources) {
        if (schema.resources.hasOwnProperty(name)) {
            root.paths['/' + name] = {
                get: {
                    description: 'List all ' + name,
                    'produces': [
                        'application/json'
                    ],
                    'responses': {
                        '200': {
                            'description': 'A list of pets.'
                        }
                    }
                }
            };
        }
    }

    return root;
}*/

/*parseJSON(__dirname + '/../schema.json').then((json)=>{
    let swagger = generateSwagger(json);
    console.info(util.inspect(swagger, {depth: 100}));
    console.info(JSON.stringify(swagger));
});*/
