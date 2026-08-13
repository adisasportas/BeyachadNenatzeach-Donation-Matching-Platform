import React from "react"; // Import React to use JSX and React functionalities.
import { Link } from "react-router-dom"; // Import Link from react-router-dom for navigation between routes.
import "../screensCSS/NotFound.css"; // Import the CSS file for styling.

export default function NotFound() {
  return (
    <div className="notfound-container">
      {/* Main container for the NotFound page */}
      <div className="notfound-animation">
        {/* 404 error code text with animation */}
        <h1 className="notfound-text">404</h1>
        {/* Description of the error */}
        <p className="notfound-description">Page Not Found</p>
      </div>
      {/* Button that links back to the home page */}
      <Link to="/" className="home-button">
        Go to Home
      </Link>
    </div>
  );
}
