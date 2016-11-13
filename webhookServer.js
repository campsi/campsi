const restify = require('restify');
const server = restify.createServer({});

server.use([
    restify.authorizationParser(),
    restify.fullResponse(),
    restify.CORS(),
    restify.queryParser({mapParams: false, allowDots: false}),
    restify.jsonBodyParser({mapParams: false}),
    restify.pre.sanitizePath()
]);

server.use((req, res, next)=> {
    console.info('method', req.method);
    console.info('headers', req.headers);
    console.info('body', req.body);
    next();
});

const ok = (req, res) => res.json(200, {}, {});
const ko = (req, res) => res.json(500, {message: 'error'}, {});

server.get('/', ok);
server.post('/', ok);
server.put('/', ok);

server.get('/ko', ko);
server.post('/ko', ko);
server.put('/ko', ko);

server.listen(3001);