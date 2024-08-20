import React from 'react';
import imgHeader from './og_header.png'; 

const HeaderP = () => {
  return (
    <header className="bg-blue-600 text-white py-4 px-6 flex justify-between items-center">
      <img src={imgHeader} alt="NxtGen Innovation" className="h-10 w-32" />
      <h2 className="text-lg">Water Meter Dashboard</h2>
      <div className="flex items-center">
        <span>Please Login</span>
      </div>
    </header>
  );
};

export default HeaderP;
