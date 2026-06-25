const fs = require('fs');
const path = 'C:/Users/home/AppData/Local/hermes/cron/output/pr_pipeline.json';
const pipeline = JSON.parse(fs.readFileSync(path, 'utf8'));
const data = {
  status: 'OPEN',
  contributors: ['dev-engineer'],
  created_at: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  url: 'https://github.com/Coding-Dev-Tools/vscode-schemaforge/pull/4',
  branch: 'improve/vscode-schemaforge-20260625043939',
  pr_number: 4
};
pipeline.repos['vscode-schemaforge'] = data;
pipeline.updated_at = new Date().toISOString();
fs.writeFileSync(path, JSON.stringify(pipeline, null, 2));
console.log('PR pipeline updated');
