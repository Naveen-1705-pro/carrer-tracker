const http = require('http');
const req = http.get('http://localhost:8000/api/health', (res) => {
  console.log('STATUS:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
});
req.on('error', (e) => {
  console.error('ERROR connecting to backend:', e.message);
});
req.end();
