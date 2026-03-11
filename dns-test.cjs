const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.cluster0.5zvdeju.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('SRV Resolution Failed:', err);
    } else {
        console.log('SRV Records Resolved:', addresses);

        // Try resolving the first host
        if (addresses.length > 0) {
            const host = addresses[0].name;
            dns.lookup(host, { family: 4 }, (err, address, family) => {
                if (err) {
                    console.error(`A Record Lookup Failed for ${host}:`, err);
                } else {
                    console.log(`A Record Resolved for ${host}:`, address, `(IPv${family})`);
                }
            });
        }
    }
});
