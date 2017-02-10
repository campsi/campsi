const express = require('express');

class CampsiService {

    constructor(config) {
        this.config = config;
        this.options = config.options;
        this.router = express.Router();
        return this;
    }

    describe() {
        return {
            title: this.config.title
        };
    }

    initialize() {
        return new Promise((resolve) => resolve());
    }
}

module.exports = CampsiService;