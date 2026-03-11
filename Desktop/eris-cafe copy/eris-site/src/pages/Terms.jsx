import React from 'react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#EDEDE6] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-amber-900 hover:text-amber-700 font-medium flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <div className="prose text-gray-700 space-y-4">
          <p>Welcome to Eris Cafe. By using our website and services, you agree to the following terms:</p>
          <h2 className="text-xl font-semibold mt-6">1. Account Usage</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information when creating an account.</p>
          <h2 className="text-xl font-semibold mt-6">2. Orders & Payments</h2>
          <p>All orders are subject to availability. Prices are displayed in Philippine Pesos (₱). Payment is required at pickup.</p>
          <h2 className="text-xl font-semibold mt-6">3. Reservations</h2>
          <p>Table reservations are subject to admin confirmation. Failure to show up may result in future reservation restrictions.</p>
          <h2 className="text-xl font-semibold mt-6">4. Modifications</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of updated terms.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
