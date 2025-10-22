import React from 'react'
import { useNavigate } from 'react-router-dom'
import CL from '../assets/ICED SERIES/(ICED) Cafe Latte.png'
import AM from '../assets/ICED SERIES/(ICED) Americano.png'
import SC from '../assets/ICED SERIES/(ICED) Salted Caramel.png'
import SL from '../assets/ICED SERIES/(ICED) Spanish Latte.png'
import CM from '../assets/ICED SERIES/CARAMELMACCHIATO.png'
import DM from '../assets/ICED SERIES/DIRTYMOCHA.png'
import OAM from '../assets/ICED SERIES/ISORANGEAM.png'
import WC from '../assets/ICED SERIES/WHIPPEDCOFFE.png'
import Navigation from '../components/Navigation';

const Category1 = () => {
    const navigate = useNavigate();
    
    const menuItems = [
        {
          id: 1,
          name: "Cafe Latte (ICED)",
          description: "Lush espresso combined with steamed milk and ice, creating a smooth and refreshing iced coffee experience.",
          price: "$28.99",
          category: "Cafe Latte (ICED)",
          image: CL,
        },
        {
          id: 2,
          name: "Americano (ICED)",
          description: "A bold and robust espresso shot served over ice, delivering a refreshing and invigorating coffee experience.",
          price: "$24.99",
          category: "Americano (ICED)",
          image: AM,
        },
        {
          id: 3,
          name: "Salted Caramel (ICED)",
          description: "Rich espresso blended with creamy milk and salted caramel syrup, topped with whipped cream and a caramel drizzle.",
          price: "$65.99",
          category: "Salted Caramel (ICED)",
          image: SC,
        },
        {
          id: 4,
          name: "Spanish Latte (ICED)",
          description: "Nutritious quinoa bowl topped with grilled vegetables, chickpeas, feta cheese, olives, and tahini dressing. Fresh and healthy.",
          price: "$19.99",
          category: "Spanish Latte (ICED)",
          image: SL,
        },
        {
          id: 5,
          name: "Caramel Macchiato (ICED)",
          description: "Fresh Atlantic salmon glazed with house-made teriyaki sauce, served with jasmine rice and steamed vegetables. A perfect balance of sweet and savory flavors.",
          price: "$28.99",
          category: "Caramel Macchiato (ICED)",
          image: CM,
        },
        {
          id: 6,
          name: "Dirty Mocha (ICED)",
          description: "Creamy Arborio rice cooked with wild mushrooms, truffle oil, and Parmesan cheese. Finished with fresh herbs and a drizzle of white truffle oil.",
          price: "$24.99",
          category: "Dirty Mocha (ICED)",
          image: DM,
        },
        {
          id: 7,
          name: "Orange Americano (ICED)",
          description: "A bold and robust espresso shot served over ice, delivering a refreshing and invigorating coffee experience.",
          price: "$65.99",
          category: "Orange Americano (ICED)",
          image: OAM,
        },
        {
          id: 8,
          name: "Whipped Coffee (ICED)",
          description: "Nutritious quinoa bowl topped with grilled vegetables, chickpeas, feta cheese, olives, and tahini dressing. Fresh and healthy.",
          price: "$19.99",
          category: "Whipped Coffee (ICED)",
          image: WC,
        }
      ];
  return (
    <div className='bg-[#EDEDE6]'  >
      <Navigation />
          {/* Food Cards Grid */}
          <h1 className='font-playfair text-center mt-12 text-5xl' >Iced Espresso Series</h1>
          <div className="grid grid-cols-2 lg:grid-cols-4  mt-[110px] py-12">
            {menuItems.map((item, index) => (
              <div 
                key={item.id}
                onClick={() => navigate('/product', { state: { product: item } })}
                className="group border-x-[1px] border-stone-500 hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 cursor-pointer"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                  {/* Image Section */}
                  <div className="w-full  h-64 sm:h-auto relative overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-[450px] h-[450px] object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-amber-950 text-white text-xs font-semibold rounded-full">
                        {item.category}
                      </span>
                      <p className='flex ml-[140px] mt-[350px] text-xl font-playfair font-light' >{item.price}</p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                </div>
            ))}
            </div>
    </div>
  );
}

export default Category1