import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/product.model.js';

dotenv.config();


const products = [
  // Iced Espresso Series (with sizes)
  {
    name: "Cafe Latte (ICED)",
    description: "Lush espresso combined with steamed milk and ice, creating a smooth and refreshing iced coffee experience.",
    price: 28.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/(ICED) Cafe Latte.png",
    stock: 100,
    isAvailable: true,
    hasSizes: true,
    sizes: [
      { name: "Small", price: 28.99, stock: 100 },
      { name: "Large", price: 38.99, stock: 100 }
    ]
  },
  {
    name: "Americano (ICED)",
    description: "A bold and robust espresso shot served over ice, delivering a refreshing and invigorating coffee experience.",
    price: 24.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/(ICED) Americano.png",
    stock: 100,
    isAvailable: true,
    hasSizes: true,
    sizes: [
      { name: "Small", price: 24.99, stock: 100 },
      { name: "Large", price: 34.99, stock: 100 }
    ]
  },
  {
    name: "Salted Caramel (ICED)",
    description: "Rich espresso blended with creamy milk and salted caramel syrup, topped with whipped cream and a caramel drizzle.",
    price: 65.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/(ICED) Salted Caramel.png",
    stock: 100,
    isAvailable: true,
    hasSizes: true,
    sizes: [
      { name: "Small", price: 65.99, stock: 100 },
      { name: "Large", price: 75.99, stock: 100 }
    ]
  },
  {
    name: "Spanish Latte (ICED)",
    description: "Creamy espresso with condensed milk and a hint of vanilla, served over ice for a sweet and smooth coffee treat.",
    price: 19.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/(ICED) Spanish Latte.png",
    stock: 100,
    isAvailable: true,
    hasSizes: true,
    sizes: [
      { name: "Small", price: 19.99, stock: 100 },
      { name: "Large", price: 29.99, stock: 100 }
    ]
  },
  {
    name: "Caramel Macchiato (ICED)",
    description: "Velvety espresso layered with vanilla-flavored milk and caramel sauce, finished with a caramel drizzle on top.",
    price: 28.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/CARAMELMACCHIATO.png",
    stock: 100,
    isAvailable: true,
    hasSizes: true,
    sizes: [
      { name: "Small", price: 28.99, stock: 100 },
      { name: "Large", price: 38.99, stock: 100 }
    ]
  },
  {
    name: "Dirty Mocha (ICED)",
    description: "Decadent espresso mixed with rich chocolate and milk, topped with whipped cream for an indulgent iced treat.",
    price: 24.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/DIRTYMOCHA.png",
    stock: 100,
    isAvailable: true,
    hasSizes: true,
    sizes: [
      { name: "Small", price: 24.99, stock: 100 },
      { name: "Large", price: 34.99, stock: 100 }
    ]
  },
  {
    name: "Orange Americano (ICED)",
    description: "Bold espresso with a refreshing twist of orange, served over ice for a citrusy coffee experience.",
    price: 65.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/ISORANGEAM.png",
    stock: 100,
    isAvailable: true,
    hasSizes: true,
    sizes: [
      { name: "Small", price: 65.99, stock: 100 },
      { name: "Large", price: 75.99, stock: 100 }
    ]
  },
  {
    name: "Whipped Coffee (ICED)",
    description: "Fluffy whipped coffee foam layered over cold milk, creating a creamy and Instagram-worthy iced beverage.",
    price: 19.99,
    category: "Iced Espresso Series",
    image: "/assets/ICED SERIES/WHIPPEDCOFFE.png",
    stock: 100,
    isAvailable: true,
    hasSizes: true,
    sizes: [
      { name: "Small", price: 19.99, stock: 100 },
      { name: "Large", price: 29.99, stock: 100 }
    ]
  },
  // Hot Espresso Series
  {
    name: "Americano (HOT)",
    description: "A bold and robust espresso shot with hot water, delivering a strong and invigorating coffee experience.",
    price: 22.99,
    category: "Hot Espresso Series",
    image: "/assets/HOT SERIES/Americano.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Cafe Latte (HOT)",
    description: "Rich espresso combined with steamed milk, creating a smooth and creamy hot coffee experience.",
    price: 26.99,
    category: "Hot Espresso Series",
    image: "/assets/HOT SERIES/Cafe Latte.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Cappuccino (HOT)",
    description: "Classic espresso topped with steamed milk and a thick layer of foam, perfectly balanced and aromatic.",
    price: 28.99,
    category: "Hot Espresso Series",
    image: "/assets/HOT SERIES/Cappuccino.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Caramel Macchiato (HOT)",
    description: "Velvety espresso layered with vanilla-flavored steamed milk and caramel sauce, finished with a caramel drizzle.",
    price: 32.99,
    category: "Hot Espresso Series",
    image: "/assets/HOT SERIES/Caramel Macchiato.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Vanilla Latte (HOT)",
    description: "Smooth espresso with steamed milk and vanilla syrup, creating a sweet and comforting hot beverage.",
    price: 29.99,
    category: "Hot Espresso Series",
    image: "/assets/HOT SERIES/Vanilla Latte.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Spanish Latte (HOT)",
    description: "Creamy espresso with condensed milk and a hint of vanilla, delivering a sweet and smooth hot coffee treat.",
    price: 30.99,
    category: "Hot Espresso Series",
    image: "/assets/HOT SERIES/Spanish Latte.png",
    stock: 100,
    isAvailable: true
  },
  // Non-Coffee Series
  {
    name: "Babyccino",
    description: "A delightful steamed milk drink with a touch of foam, perfect for kids or those who prefer no coffee.",
    price: 15.99,
    category: "Non-Coffee",
    image: "/assets/NON-COFFEE/Babyccino.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Blueberry Milk",
    description: "Creamy milk blended with sweet blueberry syrup, creating a refreshing and fruity beverage.",
    price: 25.99,
    category: "Non-Coffee",
    image: "/assets/NON-COFFEE/Blueberry Milk.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Matcha Latte (Non-Coffee)",
    description: "Smooth and creamy matcha green tea mixed with steamed milk, offering a perfect balance of earthy sweetness.",
    price: 28.99,
    category: "Non-Coffee",
    image: "/assets/hero/MATCHA.png",
    stock: 100,
    isAvailable: true
  },
  
  // Pastries
  {
    name: "Choco Chip Cookie",
    description: "Classic chocolate chip cookie with rich chocolate chips and a soft, chewy texture.",
    price: 25.00,
    category: "Pastries",
    image: "/assets/pastries/CHOCOCHIP.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Cinnamon Roll",
    description: "Soft and fluffy cinnamon roll topped with sweet cream cheese frosting.",
    price: 35.00,
    category: "Pastries",
    image: "/assets/pastries/CINNAMONROLL.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Crinkles",
    description: "Fudgy chocolate crinkle cookies dusted with powdered sugar.",
    price: 20.00,
    category: "Pastries",
    image: "/assets/pastries/CRINKLES.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Custard Tart",
    description: "Buttery tart shell filled with smooth, creamy custard.",
    price: 30.00,
    category: "Pastries",
    image: "/assets/pastries/CUSTARD.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Fries",
    description: "Crispy golden fries, perfectly seasoned and freshly fried.",
    price: 15.00,
    category: "Pastries",
    image: "/assets/pastries/FRIES.png",
    stock: 100,
    isAvailable: true,
    hasSizes: true,
    sizes: [
      { name: "Small", price: 15.00, stock: 100 },
      { name: "Medium", price: 20.00, stock: 100 },
      { name: "Large", price: 25.00, stock: 100 }
    ]
  },
  {
    name: "Grilled Cheese Sandwich",
    description: "Toasted sandwich with melted cheese, crispy on the outside and gooey on the inside.",
    price: 40.00,
    category: "Pastries",
    image: "/assets/pastries/GRILLEDCHEESE.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Garlic Bread",
    description: "Warm, buttery bread infused with garlic and herbs, toasted to perfection.",
    price: 30.00,
    category: "Pastries",
    image: "/assets/pastries/GARLICBREAD.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Oatmeal Cookie",
    description: "Hearty oatmeal cookie with a perfect chewy texture and hints of cinnamon.",
    price: 22.00,
    category: "Pastries",
    image: "/assets/pastries/OATMEAL.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Red Velvet Cupcake",
    description: "Moist red velvet cupcake topped with rich cream cheese frosting.",
    price: 38.00,
    category: "Pastries",
    image: "/assets/pastries/REDVELVET.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Siomai",
    description: "Steamed pork dumplings served with a savory soy-based dipping sauce.",
    price: 35.00,
    category: "Pastries",
    image: "/assets/pastries/SIOMAI.png",
    stock: 100,
    isAvailable: true
  },
  {
    name: "Tuna Sandwich",
    description: "Fresh tuna salad sandwich with crisp lettuce on soft bread.",
    price: 45.00,
    category: "Pastries",
    image: "/assets/pastries/TUNASANDWICH.png",
    stock: 100,
    isAvailable: true
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing products in these categories (optional - remove if you want to keep existing products)
    await Product.deleteMany({ 
      category: { 
        $in: ["Iced Espresso Series", "Hot Espresso Series", "Non-Coffee", "Pastries"] 
      } 
    });
    console.log('Cleared existing products in Iced Espresso, Hot Espresso, Non-Coffee, and Pastries categories');

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