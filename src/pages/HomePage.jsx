import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div>
      <h2 className="astro-title">Welcome To The League!</h2>
      <p className="astro-desc">
        Begin the cosmic race!<br />
        Select quickplay to begin your adventure.
      </p>
      <Link to="/quickplay">
        <button className="start-btn">Quickplay</button>
      </Link>
    </div>
  );
}

export default HomePage;
