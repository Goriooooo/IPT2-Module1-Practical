import express from 'express';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';

const router = express.Router();

// Get best sellers - products with most units sold from completed orders
router.get('/best-sellers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    
    // Aggregate orders to count units sold per product
    const salesData = await Order.aggregate([
      // Only count completed orders
      { $match: { status: { $in: ['completed', 'ready', 'preparing', 'confirmed'] } } },
      // Unwind the items array
      { $unwind: '$items' },
      // Group by productId and sum quantities
      { 
        $group: { 
          _id: '$items.productId', 
          unitsSold: { $sum: '$items.quantity' },
          productName: { $first: '$items.name' }
        } 
      },
      // Sort by units sold descending
      { $sort: { unitsSold: -1 } },
      // Limit results
      { $limit: limit }
    ]);

    // Get full product details for best sellers
    const productIds = salesData.map(item => item._id).filter(id => id);
    const products = await Product.find({ 
      _id: { $in: productIds },
      isArchived: { $ne: true },
      isAvailable: true
    });

    // Merge sales data with product data
    const bestSellers = salesData
      .map(sale => {
        const product = products.find(p => p._id.toString() === sale._id?.toString());
        if (product) {
          return {
            ...product.toObject(),
            unitsSold: sale.unitsSold
          };
        }
        return null;
      })
      .filter(item => item !== null);

    res.json({ success: true, data: bestSellers });
  } catch (error) {
    console.error('Get best sellers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all products (excluding archived by default)
router.get('/', async (req, res) => {
  try {
    const { category, featured, search, includeArchived } = req.query;
    let query = {};
    
    // By default, exclude archived products unless explicitly requested
    if (includeArchived !== 'true') {
      query.isArchived = { $ne: true };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.featured = true;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get archived products only
router.get('/archived/all', async (req, res) => {
  try {
    const products = await Product.find({ isArchived: true }).sort({ archivedAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get archived products error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create product (Admin only)
router.post('/', async (req, res) => {
  try {
    const { name, price, description, category, image, inStock, featured } = req.body;
    
    if (!name || !price || !description || !category) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, price, description, and category are required" 
      });
    }
    
    const product = new Product({
      name,
      price,
      description,
      category,
      image,
      inStock,
      featured
    });
    
    await product.save();
    
    console.log('Product created:', product.name);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update product (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    console.log('Product updated:', product.name);
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Archive product (Admin only)
router.patch('/:id/archive', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        isArchived: true,
        archivedAt: new Date(),
        isAvailable: false
      },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    console.log('Product archived:', product.name);
    res.json({ success: true, data: product, message: 'Product archived successfully' });
  } catch (error) {
    console.error('Archive product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unarchive/Restore product (Admin only)
router.patch('/:id/unarchive', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        isArchived: false,
        archivedAt: null,
        isAvailable: true
      },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    console.log('Product restored:', product.name);
    res.json({ success: true, data: product, message: 'Product restored successfully' });
  } catch (error) {
    console.error('Restore product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product permanently (Admin only) - Keep for permanent deletion if needed
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    console.log('Product deleted permanently:', product.name);
    res.json({ success: true, message: 'Product deleted permanently' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
