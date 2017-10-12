/*
 todo shall we really enforce data ?
 +it does cleaner url
 +it is not a param name but a value
 -inconsistent w/ filtering
 */
function getFieldPath(state, field) {
    return ['states', state, 'data', field].join('.');
}

/**
 * flips sorting order if field begins with minus '-'
 * @param {String} state
 * @param {String} field
 * @returns {Array<Array>}
 */
function getMongoSortArray(state, field) {
    return (!field.startsWith('-'))
        ? [getFieldPath(state, field), 1]
        : [getFieldPath(state, field.substr(1)), -1];
}

/**
 *
 * @link http://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api#advanced-queries
 * @param {Cursor} cursor
 * @param {String} state
 * @param {String} sort
 * @return {Cursor} cursor
 */
module.exports = (cursor, state, sort)=> {
    //TODO state : req.state || resource.defaultState
    if (typeof sort === 'undefined') {
        return cursor;
    }

    let fields = sort.split(',').map((field)=>getMongoSortArray(state, field));
    cursor.sort(fields);
    return cursor;
};
