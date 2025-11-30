import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    googleId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // For manual login, not required for Google OAuth
    role: { 
        type: String, 
        enum: ['customer', 'admin', 'staff', 'owner'], 
        default: 'customer',
        required: true 
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    profilePicture: { type: String },
    avatar: { type: String },
    cart: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: String,
        price: Number,
        quantity: Number,
        size: String,
        temperature: String,
        image: String,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    preferences: {
        notifications: { type: Boolean, default: true },
        theme: { type: String, default: 'light' }
    }
}, {
    timestamps: true, // Automatically adds 'createdAt' and 'updatedAt'
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

const User = mongoose.model('User', userSchema);
export default User;