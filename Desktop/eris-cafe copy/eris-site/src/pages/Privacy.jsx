import React from 'react';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <div className="prose text-gray-700 space-y-4">
          <p>Eris Cafe is committed to protecting your privacy. This policy explains how we handle your personal information.</p>
          <h2 className="text-xl font-semibold mt-6">1. Information We Collect</h2>
          <p>We collect your name, email address, and phone number when you create an account. Order and reservation data is stored to provide our services.</p>
          <h2 className="text-xl font-semibold mt-6">2. How We Use Your Information</h2>
          <p>Your information is used to process orders, manage reservations, and communicate service updates. We do not sell your data to third parties.</p>
          <h2 className="text-xl font-semibold mt-6">3. Data Security</h2>
          <p>We implement industry-standard security measures to protect your personal information, including encrypted authentication tokens.</p>
          <h2 className="text-xl font-semibold mt-6">4. Contact</h2>
          <p>For privacy-related inquiries, please contact us at hello@eriscafe.com.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
