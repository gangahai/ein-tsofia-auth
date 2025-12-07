
const qrcode = require('qrcode-terminal');
const os = require('os');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const ip = getLocalIp();
const port = '3000';
const url = `http://${ip}:${port}`;

console.log('\n=================================================');
console.log('📱 Scan this QR Code to connect from your phone:');
console.log('=================================================\n');

qrcode.generate(url, { small: true });

console.log('\nOr manually enter: ' + url);
console.log('=================================================\n');
