import React from "react";
import { Link } from "react-router-dom";
import "../screensCSS/HomePage.css"; // Make sure the CSS file path is correct

const HomePage = () => {
  // Functional component for the HomePage
  return (
    <div className="HomePage">
      {/* Main container for the homepage content */}
      <div className="main-content">
        {/* Header or slogan for the homepage */}
        <h4>EMPOWER CHANGE, DONATE TODAY: TOGETHER WE WILL WIN!</h4>

        {/* Container for the main statistics and call-to-action button */}
        <div className="content-container">
          {/* Section displaying the number of families receiving service */}
          <div className="stat">
            <p>450,000</p> {/* Number of families */}
            <p>Families receiving service</p>{" "}
            {/* Description of the statistic */}
          </div>

          {/* Call-to-action section encouraging users to donate */}
          <div className="call-to-action">
            <Link to="/Log_In">
              {" "}
              {/* Link to the login page for making donations */}
              <button>For immediate donations, please click here.</button>
            </Link>
          </div>

          {/* Section displaying the number of donations collected */}
          <div className="stat">
            <p>160,000</p> {/* Number of donations */}
            <p>Donations collected</p> {/* Description of the statistic */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; // Export the HomePage component as the default export
