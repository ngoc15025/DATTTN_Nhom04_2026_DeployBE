import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const AdminLayout = () => {
  const [showSidebar, setShowSidebar] = React.useState(false);

  return (
    <div className="d-flex">
      {/* Lớp phủ khi mở menu trên mobile */}
      {showSidebar && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-25 d-md-none" 
          style={{zIndex: 999, backdropFilter: 'blur(2px)'}}
          onClick={() => setShowSidebar(false)}
        />
      )}

      <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />
      
      <div className="main-wrapper flex-grow-1">
        <Header onMenuClick={() => setShowSidebar(!showSidebar)} />
        <main className="p-4 bg-light flex-grow-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
