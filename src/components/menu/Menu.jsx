import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Menu() {
  const [open, setOpen] = useState(false);

  const handleToggle = () => setOpen((prev) => !prev);

  return (
    <div className="menu">
      <button className="menu-title" onClick={handleToggle}>
       Menu
      </button>
      {open && (
        <div className="menu-dropdown">
          <Link to="/">
            <button className="start-btn">Home</button>
          </Link>
          <Link to="/quickplay">
            <button className="start-btn">Quickplay</button>
          </Link>
          {/* Add more menu items here */}
        </div>
      )}
    </div>
  );
}

export default Menu;
