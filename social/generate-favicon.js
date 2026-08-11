const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'public', 'logo.png');
const faviconPath = path.join(__dirname, 'public', 'favicon.png');

try {
  fs.copyFileSync(logoPath, faviconPath);
  console.log('Successfully copied logo.png to favicon.png');
} catch (error) {
  console.error('Error copying favicon:', error);
}
