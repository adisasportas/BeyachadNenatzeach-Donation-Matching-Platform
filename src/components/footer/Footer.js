import React from "react";
import "./Footer.css";

// The Footer component is a functional component that renders the footer of the page.
const Footer = () => {
  const year = new Date().getFullYear(); // Gets the current year.
  const name = "Adi Sasportas && Gal katzav"; // Defines the names to be displayed in the footer.

  return (
    // The footer element is styled with the "footer" class.
    <footer className="footer">
      <p className="copyright">
        {/* Displays the copyright text, including the current year and the specified names. */}
        &copy; All rights reserved | {year} | {name}
      </p>
      <div className="link-container">
        {/* Creates a container for social media links with icons. */}

        {/* LinkedIn link */}
        <a
          href="https://www.linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          <img
            src="https://store-images.s-microsoft.com/image/apps.31120.9007199266245564.44dc7699-748d-4c34-ba5e-d04eb48f7960.bc4172bd-63f0-455a-9acd-5457f44e4473?h=253"
            alt="LinkedIn"
            className="icon"
          />
        </a>

        {/* GitHub link */}
        <a
          href="https://github.com/GalKatzav/Mahat-Project.git"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/GitHub_Invertocat_Logo.svg/800px-GitHub_Invertocat_Logo.svg.png"
            alt="GitHub"
            className="icon"
          />
        </a>

        {/* Instagram link */}
        <a
          href="https://www.instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Instagram-Icon.png/600px-Instagram-Icon.png"
            alt="Instagram"
            className="icon"
          />
        </a>

        {/* Facebook link */}
        <a
          href="https://www.facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Facebook_icon.svg/2048px-Facebook_icon.svg.png"
            alt="Facebook"
            className="icon"
          />
        </a>
      </div>
    </footer>
  );
};

export default Footer; // Exports the Footer component as the default export of this file.
