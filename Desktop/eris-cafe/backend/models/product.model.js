import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true 
    },
    description: { 
        type: String, 
        required: true
    },
    category: {
        type: String,
        required: true,
        default: 'Uncategorized'
    },
    image: {
        type: String,
        default: ''
    },
    stock: {
        type: Number,
        default: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date,
        default: null
    },
    hasSizes: {
        type: Boolean,
        default: false
    },
    sizes: [{
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        stock: {
            type: Number,
            default: 100
        }
    }]
}, {
    timestamps: true,
    optimisticConcurrency: true // Enable version key for concurrent stock updates
});

// Index for stock queries
productSchema.index({ stock: 1, isAvailable: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;  
