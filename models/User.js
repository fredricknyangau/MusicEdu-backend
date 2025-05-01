const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    minlength: [3, "Full name must be at least 3 characters"],
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    minlength: [4, "Username must be at least 4 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [/.+\@.+\..+/, "Email format is invalid"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  role: { type: String, default: "user" },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});


userSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    return resetToken;
};

module.exports = mongoose.model('User', userSchema);