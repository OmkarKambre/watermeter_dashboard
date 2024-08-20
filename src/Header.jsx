import React from 'react';
import { useNavigate } from 'react-router-dom';
import imgHeader from './og_header.png'; 

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
   
    navigate('/'); 
  };

  return (
    <header className="bg-blue-600 text-white py-4 px-6 flex justify-between items-center">
      <img src={imgHeader} alt="NxtGen Innovation" className="h-10 w-32" />
      <h2 className="text-lg">Water Meter Dashboard</h2>
      <div className="flex items-center">
        <span>Welcome, admin</span>
        <a
          href="https://inmac-digital-watermeter.netlify.app/"
          className="ml-4 text-white underline"
          onClick={(e) => {
            e.preventDefault(); 
            handleLogout(); 
          }}
        >
          Logout
        </a>
      </div>
    </header>
  );
};

export default Header;
