module.exports = function findCallback(args) {
    let i = 0;
    for (; i < args.length; i++) {
        if (typeof args[i] === 'function') {
            return {callback: args[i], index: i};
        }
    }
};
