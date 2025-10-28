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
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

export default Product;  
