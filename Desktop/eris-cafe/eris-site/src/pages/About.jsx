function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">About Eris Cafe</h1>
            <p className="text-xl max-w-3xl mx-auto">
              A story of passion, community, and exceptional coffee that began with a simple dream.
            </p>
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 mb-6">
                Founded in 2020, Eris Cafe began as a small dream in the heart of our community. 
                What started as a passion for exceptional coffee and warm hospitality has grown 
                into a beloved gathering place for locals and visitors alike.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We believe that great coffee is more than just a beverage—it's an experience that 
                brings people together, sparks conversations, and creates lasting memories. Every 
                cup we serve is crafted with care, using only the finest beans sourced from 
                sustainable farms around the world.
              </p>
              <p className="text-lg text-gray-600">
                Our commitment to quality extends beyond our coffee to every aspect of your visit, 
                from our freshly baked pastries to our welcoming atmosphere and friendly service.
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-8">
              <div className="text-center">
                <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-6xl">☕</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-600">
                  To create a welcoming space where community thrives, 
                  conversations flourish, and every cup tells a story.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sustainability</h3>
              <p className="text-gray-600">
                We're committed to environmentally responsible practices, from sourcing 
                fair-trade beans to using compostable packaging.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Community</h3>
              <p className="text-gray-600">
                We believe in supporting our local community and creating a space where 
                everyone feels welcome and valued.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Quality</h3>
              <p className="text-gray-600">
                We never compromise on quality, ensuring every product and service 
                meets our high standards of excellence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">The passionate people behind Eris Cafe</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👨‍🍳</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Alex Chen</h3>
              <p className="text-amber-600 font-semibold mb-2">Head Barista</p>
              <p className="text-gray-600">
                With 8 years of experience, Alex brings passion and expertise to every cup.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👩‍🍳</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sarah Johnson</h3>
              <p className="text-amber-600 font-semibold mb-2">Pastry Chef</p>
              <p className="text-gray-600">
                Sarah's creative pastries and baked goods are a daily delight for our customers.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👨‍💼</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mike Rodriguez</h3>
              <p className="text-amber-600 font-semibold mb-2">Manager</p>
              <p className="text-gray-600">
                Mike ensures every customer has an exceptional experience at Eris Cafe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About

