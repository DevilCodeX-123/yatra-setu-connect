const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
    console.log('--- Database Connection Test ---');
    console.log('URI:', process.env.MONGODB_URI ? 'Defined' : 'UNDEFINED');

    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected!');

        console.log('Running test query on "users" collection...');
        // We use the raw collection to avoid model overhead if it's not defined
        const count = await mongoose.connection.db.collection('users').countDocuments();
        console.log('✅ Query success! User count:', count);

        process.exit(0);
    } catch (err) {
        console.error('❌ Connection or Query failed:');
        console.error(err);
        process.exit(1);
    }
}

testConnection();
