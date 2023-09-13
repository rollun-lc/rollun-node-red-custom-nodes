const { readAwsSpApiModels } = require('./read-all-models');

const models = readAwsSpApiModels('selling-partner-api-models/models');

function setUpHttpApi(RED) {
  RED.httpAdmin.get('/aws-sp-api/models', function (req, res) {
    return res.status(200).send({
      models: models.map(({ id, name, versions }) => ({
        id,
        name,
        versions: versions.map(({ info }) => info),
      })),
    });
  });

  RED.httpAdmin.get(
    '/aws-sp-api/models/:id/versions/:version',
    function (req, res) {
      const model = models.find((model) => model.id === req.params.id);
      if (!model) {
        return res
          .status(404)
          .send({ error: `Model ${req.params.id} not found` });
      }

      const version = model.versions.find(
        (version) => version.info.version === req.params.version
      );
      if (!version) {
        return res.status(404).send({
          error: `Version ${req.params.version} for ${req.params.id} not found`,
        });
      }

      return res.status(200).send(version);
    }
  );
}

module.exports = function (RED) {
  function AwsSpApi(n) {
    RED.nodes.createNode(this, n);

    const node = this;

    setUpHttpApi(RED);

    node.on('input', async function (msg) {
      node.send([msg]);
    });
  }

  RED.nodes.registerType('rollun-aws-sp-api', AwsSpApi);
};
