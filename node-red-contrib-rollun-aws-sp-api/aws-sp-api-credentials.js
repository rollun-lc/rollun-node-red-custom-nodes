module.exports = function (RED) {
  function AwsSpApiConfig(n) {
    RED.nodes.createNode(this, n);

    this.awsSpApiRefreshToken = n.awsSpApiRefreshToken;
    this.awsSpApiClientId = n.awsSpApiClientId;
    this.awsSpApiClientSecret = n.awsSpApiClientSecret;
    this.awsAccessKeyId = n.awsAccessKeyId;
    this.awsSecretAccessKey = n.awsSecretAccessKey;
  }

  RED.nodes.registerType('rollun-aws-sp-api-credentials', AwsSpApiConfig);
};
