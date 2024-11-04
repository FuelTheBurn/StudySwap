const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: String
})

const UserModel = mongoose.model("tags", UserSchema)
module.exports = UserModel