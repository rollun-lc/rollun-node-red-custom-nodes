const fs = require('fs');

function readOpenApi(file) {
  console.log('read', file);
  return JSON.parse(fs.readFileSync(file, 'utf-8'), null, 2);
}

function readAwsSpApiModels(path) {
  const files = fs.readdirSync(path);

  const apis = files.map((file) => {
    const versions = fs.readdirSync(`${path}${file}`);

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
