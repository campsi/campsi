module.exports = function buildLink(req, page, keptParams) {
    let params = {
        page: page
    };
    for(let keptParam of keptParams) {
        if(req.query && req.query.hasOwnProperty(keptParam)) {
            params[keptParam] = req.query[keptParam];
        }
    }
    let path = req.baseUrl + req.path;
    let query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
    return '{0}://{1}{2}?{3}'.format(req.protocol, req.get('host'), path, query);
};
