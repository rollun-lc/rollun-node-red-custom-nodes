const fs = require('fs');

function readOpenApi(file) {
  const openapi = JSON.parse(fs.readFileSync(file, 'utf-8'), null, 2);

  // in some cases openapi may be invalid and can include
  // non http methods in path, need to clean it up
  // Example:

  // "paths": {
  //   "/aplus/2020-11-01/contentDocuments": {
  //     "get": { ... }
  //     "post": { ... }
  //     "parameters": []
  // }
  // parameters - needs to be removed

  Object.values(openapi.paths).forEach((path) => {
    const validHttpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head'];
    Object.keys(path).forEach((method) => {
      if (!validHttpMethods.includes(method)) {
        delete path[method];
      }
    });
  });

  return openapi;
}

function readAwsSpApiModels(path) {
  path = __dirname + '/' + path;

  const files = fs.readdirSync(path);

  const apis = files.map((file) => {
    const versions = fs.readdirSync(`${path}/${file}`);

    return {
      // convert 'aplus-content-api' to 'Aplus Content Api'
      id: file,
      name: file
        .replace('-model', '')
        .replace(/^[a-z]/g, (m) => m.toUpperCase())
        .replace(/-[a-z]/g, (m) => m.toUpperCase().replace('-', ' ')),
      versions: versions
        .filter((version) => version.endsWith('.json'))
        .map((version) => readOpenApi(`${path}/${file}/${version}`)),
    };
  });

  return apis;
}

module.exports = { readAwsSpApiModels };
