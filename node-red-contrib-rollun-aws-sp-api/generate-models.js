const { readAwsSpApiModels } = require('./read-all-models');
const fs = require('node:fs');

const models = readAwsSpApiModels('selling-partner-api-models/models');

fs.writeFileSync('models.json', JSON.stringify(models, null, 2));

console.log('models written to models.json');
