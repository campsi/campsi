const defaults = {
    page: 1,
    perPage: 100
};

/**
 *
 * @param {Cursor} cursor
 * @param {object} query
 * @param {object} [options]
 *
 * @return {Cursor} cursor
 */
module.exports = (cursor, query, options)=> {
    const params = Object.assign({}, defaults, options, query);
    cursor.skip((params.page - 1) * params.perPage).limit(params.perPage);
    return cursor;
};

module.exports.defaults = defaults;