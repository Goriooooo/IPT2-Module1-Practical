import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/product.model.js';

dotenv.config();


const products = [
  {
    name: "Cafe Latte (ICED)",
    description: "Lush espresso combined with steamed milk and ice, creating a smooth and refreshing iced coffee experience.",
    price: 28.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/(ICED) Cafe Latte.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Americano (ICED)",
    description: "A bold and robust espresso shot served over ice, delivering a refreshing and invigorating coffee experience.",
    price: 24.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/(ICED) Americano.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Salted Caramel (ICED)",
    description: "Rich espresso blended with creamy milk and salted caramel syrup, topped with whipped cream and a caramel drizzle.",
    price: 65.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/(ICED) Salted Caramel.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Spanish Latte (ICED)",
    description: "Creamy espresso with condensed milk and a hint of vanilla, served over ice for a sweet and smooth coffee treat.",
    price: 19.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/(ICED) Spanish Latte.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Caramel Macchiato (ICED)",
    description: "Velvety espresso layered with vanilla-flavored milk and caramel sauce, finished with a caramel drizzle on top.",
    price: 28.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/CARAMELMACCHIATO.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Dirty Mocha (ICED)",
    description: "Decadent espresso mixed with rich chocolate and milk, topped with whipped cream for an indulgent iced treat.",
    price: 24.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/DIRTYMOCHA.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Orange Americano (ICED)",
    description: "Bold espresso with a refreshing twist of orange, served over ice for a citrusy coffee experience.",
    price: 65.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/ISORANGEAM.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Whipped Coffee (ICED)",
    description: "Fluffy whipped coffee foam layered over cold milk, creating a creamy and Instagram-worthy iced beverage.",
    price: 19.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/WHIPPEDCOFFE.png",
    stock: 100,
    isAvailable: true
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing products (optional - remove if you want to keep existing products)
    await Product.deleteMany({ category: "Iced Espresso Series" });
    console.log('Cleared existing Iced Espresso Series products');

    // Insert new products
    const insertedProducts = await Product.insertMany(products);
    console.log(`✅ Successfully added ${insertedProducts.length} products to database!`);
    
    console.log('\nProducts added:');
    insertedProducts.forEach(product => {
      console.log(`- ${product.name} ($${product.price})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();