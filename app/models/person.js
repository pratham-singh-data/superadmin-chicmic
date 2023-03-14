const { Schema, model, } = require(`mongoose`);

const personSchema = new Schema({
    name: String,
    password: String,
    email: String,
    role: String,
});

const PersonModel = model(`person`, personSchema);

module.exports = {
    PersonModel,
};
