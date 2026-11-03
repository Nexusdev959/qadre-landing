const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'dist', 'qadre-landing', 'browser');
const cloudflareDir = path.join(__dirname, 'dist', 'cloudflare');
const rootDistDir = path.join(__dirname, 'dist', 'qadre-landing');

if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, cloudflareDir, { recursive: true });
  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    if (file !== 'browser') {
      fs.cpSync(path.join(srcDir, file), path.join(rootDistDir, file), { recursive: true });
    }
  }
  console.log('✓ Build output synced to dist/cloudflare and dist/qadre-landing');
} else {
  console.warn('! Source dir does not exist:', srcDir);
}

