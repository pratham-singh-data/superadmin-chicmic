const mongoose = require(`mongoose`);
const { DatabaseURL, } = require('../../config');

module.exports = async function() {
    await mongoose.connect(DatabaseURL);
    console.log(`Connection successful to ${DatabaseURL}`);
};
