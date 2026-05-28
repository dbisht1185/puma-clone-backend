const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n======================================================');
    console.log('    __  ___                               __  ___  ');
    console.log('   /  |/  /___  ____  ____  ____  ____   /  |/  /  ');
    console.log('  / /|_/ / __ \\/ __ \\/ __ `/ __ \\/ __ \\ / /|_/ /   ');
    console.log(' / /  / / /_/ / / / / /_/ / /_/ / /_/ // /  / /    ');
    console.log('/_/  /_/\\____/_/ /_/\\__, /\\____/\\____//_/  /_/     ');
    console.log('                   /____/                          ');
    console.log('======================================================');
    console.log(` DATABASE STATUS: CONNECTED SUCCESSFULLY`);
    console.log(` HOST ADDRESS   : ${conn.connection.host}`);
    console.log('======================================================\n');
  } catch (error) {
    console.error(`\nMongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
