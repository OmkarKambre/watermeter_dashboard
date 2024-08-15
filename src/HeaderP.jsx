import React from 'react';

const HeaderP = () => {

  return (
    <header className="bg-blue-600 text-white py-4 px-6 flex justify-between items-center">
      <h1 className="text-xl font-bold">NxtGen Innovation</h1>
      <h2 className="text-lg">Water Meter Dashboard</h2>
      <div className="flex items-center">
        <span>Welcome, admin</span>
      </div>
    </header>
  );
};

export default HeaderP;
