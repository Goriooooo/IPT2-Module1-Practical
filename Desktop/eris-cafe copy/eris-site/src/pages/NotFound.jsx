import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <motion.div
      className="min-h-screen bg-[#EDEDE6] flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-amber-900 mb-4">404</h1>
        <h2 className="text-2xl font-playfair text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/home"
            className="px-6 py-3 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition font-medium"
          >
            Go Home
          </Link>
          <Link
            to="/shop"
            className="px-6 py-3 border border-amber-900 text-amber-900 rounded-lg hover:bg-amber-50 transition font-medium"
          >
            Shop
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default NotFound;
