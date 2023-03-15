module.exports = {
    SECRET_KEY: process.env.SECRET_KEY,
    SALT: process.env.SALT,
    DatabaseURL: `mongodb://localhost:27017/admin-mongo`,
    TokenExpiryTime: 1800, // 30 * 60
};
