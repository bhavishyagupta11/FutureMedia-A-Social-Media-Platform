const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const infraDir = path.join(rootDir, 'infrastructure');
const githubDir = path.join(rootDir, '.github', 'workflows');

[infraDir, path.join(infraDir, 'nginx'), path.join(infraDir, 'redis'), githubDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Dockerfiles
const serverDocker = `FROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\n\nFROM node:18-alpine\nWORKDIR /app\nCOPY --from=builder /app .\nEXPOSE 5000\nCMD ["npm", "start"]`;
fs.writeFileSync(path.join(rootDir, 'server', 'Dockerfile'), serverDocker);

const socialDocker = `FROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=builder /app/build /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]`;
fs.writeFileSync(path.join(rootDir, 'social', 'Dockerfile'), socialDocker);

const intelDocker = `FROM python:3.10-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`;
fs.writeFileSync(path.join(rootDir, 'intelligence', 'Dockerfile'), intelDocker);

// Docker Compose files
const composeBase = `version: '3.8'\nservices:\n  server:\n    build: ./server\n    ports: ["5000:5000"]\n    depends_on: [redis, mongodb]\n    environment:\n      - REDIS_URL=redis://redis:6379\n      - MONGO_URI=mongodb://mongodb:27017/socialloop\n  intelligence:\n    build: ./intelligence\n    ports: ["8000:8000"]\n  social:\n    build: ./social\n    ports: ["3000:80"]\n  redis:\n    image: redis:alpine\n    ports: ["6379:6379"]\n  mongodb:\n    image: mongo:6\n    ports: ["27017:27017"]\n`;
fs.writeFileSync(path.join(rootDir, 'docker-compose.yml'), composeBase);
fs.writeFileSync(path.join(rootDir, 'docker-compose.dev.yml'), composeBase.replace('build: ./social', 'build:\n      context: ./social\n      target: development'));
fs.writeFileSync(path.join(rootDir, 'docker-compose.prod.yml'), composeBase);

// GitHub Actions
const ghAction = `name: SocialLoop CI/CD\n\non:\n  push:\n    branches: [ "main" ]\n\njobs:\n  build-and-test:\n    runs-on: ubuntu-latest\n    steps:\n    - uses: actions/checkout@v3\n    - name: Use Node.js\n      uses: actions/setup-node@v3\n      with:\n        node-version: 18\n    - name: Install & Test Server\n      run: cd server && npm ci && npm test\n    - name: Docker Build\n      run: docker-compose build\n    - name: Deploy Placeholder\n      run: echo "Deployment disabled until AWS secrets added"\n`;
fs.writeFileSync(path.join(githubDir, 'main.yml'), ghAction);

// Nginx
const nginxConf = `server {\n  listen 80;\n  server_name socialloop.com;\n  location / {\n    proxy_pass http://social:80;\n  }\n  location /api/ {\n    proxy_pass http://server:5000;\n  }\n}`;
fs.writeFileSync(path.join(infraDir, 'nginx', 'nginx.conf'), nginxConf);

console.log('Phase 4 Docker, Nginx, and GitHub Actions scaffolded.');
