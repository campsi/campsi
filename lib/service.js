const express = require('express');

/**
 * Abstract class of each service mounted in campsi
 * @member {CampsiServer} server  Campsi server, set at load time by server itself
 * @member {Db}           db      MongoDb instance, set at load time by server itself
 * @member {String}       path    Path where the service is mounted, set at load time by server itself
 * @member {Object}       config  Standard configuration of this service
 * @member {Object}       options Specific configuration of this service
 * @member {Router}       router  Express router of this service
 */
class CampsiService {
  /**
   * Create the service
   * @param   {Object}        config As defined in global configuration
   * @returns {CampsiService}        Service created
   */
  constructor (config) {
    this.config = config;
    this.options = config.options;
    this.router = express.Router();
    return this;
  }

  /**
   * Method to extend, describe the service
   * @returns {Object} Service description
   */
  describe () {
    return {
      title: this.config.title
    };
  }

  /**
   * Method to extend, initialize the service
   * @returns {Promise} Return a promise, resolved when service initialization is done
   */
  initialize () {
    return new Promise((resolve) => resolve());
  }

  /**
   * Method to extend, should return all middlewares to include in main router
   * @returns {Array} Middlewares provided by the service
   */
  getMiddlewares () {
    return [];
  }

  /**
   * Dispatch a new event in campsi event system, prepend service base topic
   * @param  {String}  topic   The end part of the topic
   * @param  {*}       payload This is the payload of the event
   * @return {Boolean}         Returns true if there were any listeners called for this topic
   */
  emit (topic, payload) {
    topic = this.path + '/' + (topic[0] === '/' ? topic.substr(1) : topic);
    return this.server.emit(topic, payload);
  }
}

module.exports = CampsiService;
