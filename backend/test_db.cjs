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

        const isMaster = await mongoose.connection.db.admin().command({ isMaster: 1 });
        console.log('Is Primary:', isMaster.ismaster);
        console.log('Me:', isMaster.me);

        console.log('Running test write on "buses" collection...');
        await mongoose.connection.db.collection('buses').updateOne(
            { busNumber: "TEST-123" },
            { $set: { lastTested: new Date() } },
            { upsert: true }
        );
        console.log('✅ Write success!');

        process.exit(0);
    } catch (err) {
        console.error('❌ Connection or Query failed:');
        console.error(err);
        process.exit(1);
    }
}

testConnection();
