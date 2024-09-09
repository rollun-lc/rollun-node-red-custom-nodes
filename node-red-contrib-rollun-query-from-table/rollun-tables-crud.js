const {
  getTypedFieldValue,
  displayStatus,
} = require('node-red-contrib-rollun-backend-utils');
const { HttpDatastore } = require('./http-datastore');

function isEmptyArrayResponse(response) {
  return Array.isArray(response) && response.length === 0;
}

module.exports = function (RED) {
  function DatastoreCRUD(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', function (msg) {
      displayStatus(node, 'in-progress');
      const makeError = (node, text) => {
        msg.payload = { error: text };
        displayStatus(node, 'error');
        node.send([msg, null]);
      };

      if (!config.url) return makeError(node, `url is required!`);
      if (!config.action) return makeError(node, `action is required!`);
      if (!config.payload) return makeError(node, `payload is required!`);
      if (!config.idField) return makeError(node, `idField is required!`);

      const { url, action, idField, timeout, log } = config;

      const datastore = new HttpDatastore({
        URL: url,
        timeout: +timeout,
        idField,
        msg,
        logRequest: log,
      });

      const payload = getTypedFieldValue(msg, config.payload);

      datastore[action]('', payload)
        .then((result) => {
          msg.payload = result;
          const isErrorResponse = result && result.error;

          if (isErrorResponse) {
            displayStatus(node, 'error');
            node.send([msg, null]);
            return;
          }

          const status = isEmptyArrayResponse(result) ? 'warning' : 'done';
          displayStatus(node, status);
          node.send([null, msg]);
        })
        .catch((err) => {
          displayStatus(node, 'error');
          msg.payload = { error: err.message, request: err.request };
          node.send([msg, null]);
        });
    });
  }

  RED.nodes.registerType('rollun-tables-crud', DatastoreCRUD);
};
