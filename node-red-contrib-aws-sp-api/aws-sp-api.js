const models = readAwsSpApiModels('./selling-partner-api-models/models');

function setUpHttpApi(RED) {
  RED.httpAdmin.get('/aws-sp-api/models', function (req, res) {
    return res.status(200).send({
      models: models.map(({ id, name }) => ({ id, name })),
    });
  });

  RED.httpAdmin.get('/aws-sp-api/models/:id', function (req, res) {
    const model = models.find((model) => model.id === req.params.id);
    if (!model) {
      return res
        .status(404)
        .send({ error: `Model ${req.params.id} not found` });
    }

    return res.status(200).send({
      model: models.find((model) => model.id === req.params.id),
    });
  });
}

module.exports = function (RED) {
  function AwsSpApi(n) {
    RED.nodes.createNode(this, n);

    setUpHttpApi(RED);
  }

  RED.nodes.registerType('aws-sp-api', AwsSpApi);
};
