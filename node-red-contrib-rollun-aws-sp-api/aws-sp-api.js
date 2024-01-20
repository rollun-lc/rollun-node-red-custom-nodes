const { readAwsSpApiModels } = require('./read-all-models');
const { SellingPartner } = require('amazon-sp-api');
const { getTypedFieldValue } = require('node-red-contrib-rollun-backend-utils');

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

function createSpClient(creds) {
  return new SellingPartner({
    region: 'na',
    refresh_token: creds.awsSpApiRefreshToken,
    credentials: {
      SELLING_PARTNER_APP_CLIENT_ID: creds.awsSpApiClientId,
      SELLING_PARTNER_APP_CLIENT_SECRET: creds.awsSpApiClientSecret,
      AWS_ACCESS_KEY_ID: creds.awsAccessKeyId,
      AWS_SECRET_ACCESS_KEY: creds.awsSecretAccessKey,
    },
  });
}

function getOperation(schemaId, version, method, path) {
  const model = models.find((model) => model.id === schemaId);
  if (!model) {
    throw new Error(`Model ${schemaId} not found`);
  }

  const modelVersion = model.versions.find(
    (modelVersion) => modelVersion.info.version === version
  );
  if (!modelVersion) {
    throw new Error(`Version ${version} for ${schemaId} not found`);
  }

  const operation = modelVersion.paths[path][method];
  if (!operation) {
    throw new Error(`Operation ${method} ${path} not found`);
  }

  return `${schemaId}.${operation.operationId}`;
}

module.exports = function (RED) {
  setUpHttpApi(RED);

  function AwsSpApi(n) {
    const node = this;

    RED.nodes.createNode(node, n);
    const creds = RED.nodes.getNode(n.config);

    node.on('input', async function (msg) {
      try {
        const spCLient = createSpClient(creds);

        const [schemaId, version] = n.schema.split('|');
        const [method, path] = n.operation.split(' ');
        const operation = getOperation(schemaId, version, method, path);

        if (!operation) {
          throw new Error(
            `Request without operationId in schema is not supported`
          );
        }

        const body = getTypedFieldValue(msg, n.body);
        const pathParams = getTypedFieldValue(msg, n.pathParams);
        const query = getTypedFieldValue(msg, n.query);

        const request = {
          operation,
          options: { version },
        };
        if (body) {
          request.body = body;
        }
        if (pathParams) {
          request.path = pathParams;
        }
        if (query) {
          request.query = query;
        }

        if (n.debug === true) {
          msg.awsSpApiDebug = {
            request,
          };
        }

        msg.payload = await spCLient.callAPI(request);

        node.send([null, msg]);
      } catch (error) {
        msg.payload = { error };
        node.send([msg]);
      }
    });
  }

  RED.nodes.registerType('rollun-aws-sp-api', AwsSpApi);
};
