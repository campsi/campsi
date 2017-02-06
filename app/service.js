const express = require('express');

class CampsiService {

    constructor(config, db) {
        this.config = config;
        this.options = config.options;
        this.db = db;
        this.router = express.Router();
        return this;
    }

    describe() {
        return {
            title: this.config.title,
            kind: this.config.kind
        }
    }

    initialize() {
        return new Promise((resolve) => resolve());
    }
}

module.exports = CampsiService;