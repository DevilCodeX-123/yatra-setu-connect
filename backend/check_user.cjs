const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const ALT_URI = "mongodb://dbadmin:Devilboss8055@ac-aqxq5lv-shard-00-00.5zvdeju.mongodb.net:27017,ac-aqxq5lv-shard-00-01.5zvdeju.mongodb.net:27017,ac-aqxq5lv-shard-00-02.5zvdeju.mongodb.net:27017/yatra_setu?ssl=true&replicaSet=atlas-ktacmv-shard-0&authSource=admin&retryWrites=true&w=majority";

const checkUser = async () => {
    try {
        console.log('Connecting with explicit replicaSet URI and tlsInsecure...');
        await mongoose.connect(ALT_URI, {
            serverSelectionTimeoutMS: 10000,
            tlsInsecure: true
        });
        console.log('✅ Connected!');

        const user = await User.findOne({ email: 'omgupta6325@gmail.com' });
        if (user) {
            console.log('USER_FOUND:', JSON.stringify(user));
        } else {
            console.log('USER_NOT_FOUND');
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:');
        console.error(err);
        process.exit(1);
    }
};

checkUser();
