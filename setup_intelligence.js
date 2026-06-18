const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'intelligence');

const dirs = [
  '',
  'config',
  'datasets',
  'ranking',
  'recommendation',
  'analytics',
  'graph',
  'similarity',
  'training',
  'evaluation',
  'features',
  'utils',
  'models',
  'scripts',
  'tests'
];

dirs.forEach(dir => {
  const target = path.join(baseDir, dir);
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  if (dir !== '' && dir !== 'datasets') {
    fs.writeFileSync(path.join(target, '__init__.py'), '');
  }
});

const reqs = `
fastapi==0.104.1
uvicorn==0.24.0.post1
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
networkx==3.2.1
joblib==1.3.2
pydantic==2.5.2
`;
fs.writeFileSync(path.join(baseDir, 'requirements.txt'), reqs.trim());

fs.writeFileSync(path.join(baseDir, 'README.md'), '# SocialLoop Intelligence Platform\n\nIndependent Python microservice for graph traversal, recommendation ranking, and analytics computation.');

console.log('Intelligence directory created successfully.');
