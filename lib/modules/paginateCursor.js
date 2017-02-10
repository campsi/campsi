const defaults = {
    page: 1,
    perPage: 100
};

/**
 *
 * @param {Cursor} cursor
 * @param {object} query
 * @param {object} [options]
 * @return {{cursor: {Cursor}, skip: {Number}, limit: {Number}, page: {Number}}}
 */
module.exports = function paginateCursor(cursor, query, options) {
    const params = Object.assign({}, defaults, options, query);
    const page = parseInt(params.page);
    const skip = (page - 1) * parseInt(params.perPage);
    const limit = parseInt(params.perPage);
    cursor.skip(skip).limit(limit);
    return {
        cursor: cursor,
        skip: skip,
        limit: limit,
        page: page
    };
};

module.exports.defaults = defaults;