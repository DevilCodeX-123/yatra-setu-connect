const mongoose = require('mongoose');

const uri = "mongodb://dbadmin:Devilboss8055@ac-aqxq5lv-shard-00-00.5zvdeju.mongodb.net:27017/test?authSource=admin&ssl=true&directConnection=true";

console.log('Attempting direct shard connection (directConnection=true)...');

mongoose.connect(uri, {
    family: 4,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
})
    .then(() => {
        console.log('✅ Connection Successful!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection Failed!');
        console.error(err);
        process.exit(1);
    });
