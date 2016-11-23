const server = require('express')();

const ok = (req, res) => res.json(200, {}, {});
const ko = (req, res) => res.json(500, {message: 'error'}, {});

server.get('/', ok);
server.post('/', ok);
server.put('/', ok);

server.get('/ko', ko);
server.post('/ko', ko);
server.put('/ko', ko);

server.listen(3001);