const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

console.log('Attempting to connect to:', uri.replace(/:([^:@/]+)@/, ':****@'));

mongoose.connect(uri, {
    family: 4,
    serverSelectionTimeoutMS: 5000
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
