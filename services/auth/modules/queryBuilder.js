module.exports.filterUserByEmailOrProviderId = (provider, profile) => {
    let query = {$or: []};
    let identityIdFilter = {};
    identityIdFilter['identities.' + provider.name + '.id'] = profile.identity.id;
    query.$or.push(identityIdFilter);

    if (profile.email) {
        query.$or.push({email: profile.email});
    }

    return query;
};
