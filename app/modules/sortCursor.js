function getFieldPath(req, field) {
    return ['states', req.state || req.resource.defaultState, 'data', field].join('.');
}

function getMongoSortArray(req, field) {
    return (field.indexOf('-') !== 0)
        ? [getFieldPath(req, field), 1]
        : [getFieldPath(req, field.substr(1)), -1];
}

/**
 *
 * @link http://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api#advanced-queries
 * @param {Cursor} cursor
 * @param {Object} req
 *
 * @return {Cursor} cursor
 */
module.exports = (cursor, req)=> {
    if (typeof req.query.sort === 'undefined') {
        return cursor;
    }

    let fields = req.query.sort.split(',').map((field)=>getMongoSortArray(req, field));
    cursor.sort(fields);
    return cursor;
};