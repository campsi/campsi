const fs = require('fs');
const BYTE_ORDER_MARK = /^\ufeff/g;

module.exports = function parseJSON (filename) {
  return new Promise((resolve, reject) => {
    let json = null;
    fs.readFile(filename, 'utf8', (err, content) => {
      if (err) {
        return reject(err);
      }
      try {
        json = JSON.parse(content.replace(BYTE_ORDER_MARK, ''));
      } catch (jsonParseError) {
        return reject(jsonParseError);
      }
      return resolve(json);
    });
  });
};
