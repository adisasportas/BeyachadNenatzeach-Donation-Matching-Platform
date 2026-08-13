import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../services/contexts/UserContext";
import "./Navbar.css";
import icon from "../../images/icon.jpg";
import { signOutFromLoggedUser } from "../signOut/SignOut";
import { firebase } from "../../services/firebase/FireStore";
import { collection, getDocs, query, where } from "firebase/firestore";

// The Navbar component handles the navigation bar and its functionalities.
export default function Navbar() {
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  ); // State to store the current time, initialized to the current time.
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to track whether the hamburger menu is open or closed.
  const { user, setUser } = useUser(); // Accesses the user context to get the current user and a function to set the user.
  const [isAdmin, setIsAdmin] = useState(false); // State to track if the current user is an admin.
  const navigate = useNavigate(); // Hook for navigation between routes.

  // useEffect to update the time every second.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000); // Updates the current time every second.

    return () => clearInterval(timer); // Clears the timer when the component unmounts.
  }, []);

  // useEffect to check if the current user is an admin.
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || !user.id) {
        console.log("No valid user found. User is:", user); // Logs a message if no valid user is found.
        return;
      }

      console.log("Checking admin status for user:", user.id); // Logs the user ID being checked for admin status.

      const db = firebase; // Initializes the Firestore database instance.
      const usersRef = collection(db, "users"); // References the "users" collection in Firestore.
      const q = query(
        usersRef,
        where("userName", "==", "admin"),
        where("fullName", "==", "admin")
      ); // Queries the collection to find a user with both "userName" and "fullName" equal to "admin".

      try {
        const querySnapshot = await getDocs(q); // Executes the query and retrieves matching documents.
        if (!querySnapshot.empty) {
          const adminDoc = querySnapshot.docs[0]; // Gets the first matching document.
          if (adminDoc.id === user.id) {
            console.log("User is an admin."); // Logs if the user is identified as an admin.
            setIsAdmin(true); // Sets the state to indicate the user is an admin.
          } else {
            console.log("User is not an admin."); // Logs if the user is not an admin.
          }
        } else {
          console.log("No admin user found in database."); // Logs if no admin user is found in the database.
        }
      } catch (error) {
        console.error("Error checking admin status:", error); // Logs any errors that occur during the admin check.
      }
    };

    checkAdmin(); // Calls the function to check if the user is an admin.
  }, [user]); // The effect runs whenever the `user` changes.

  // Function to toggle the hamburger menu open or closed.
  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen); // Toggles the state between true and false.
    console.log("Menu state after click:", !isMenuOpen); // Logs the new state of the menu.
  };

  // Function to handle user logout.
  const handleLogout = () => {
    setIsAdmin(false); // Resets the admin state to false.
    setUser(null); // Clears the user information in the context.
    signOutFromLoggedUser(); // Calls the full logout function.
    navigate("/"); // Navigates back to the home page after logout.
  };

  return (
    <div>
      <nav className="navbar">
        {/* Logo and current time display */}
        <div className="logo-and-time">
          <Link to="/">
            <img
              src={icon}
              alt="logoProject"
              style={{ width: "100px", height: "auto" }}
            />
          </Link>
          <span className="current-time">{currentTime}</span>
        </div>

        {/* Main navigation links */}
        <div className="navbar-main-links">
          <Link to="/" className="nav-link">
            Home Page
          </Link>
          <Link to="/Messages" className="nav-link">
            Messages
          </Link>
          <Link to="/About_Me" className="nav-link">
            About Me
          </Link>
          {user ? (
            <button onClick={handleLogout} className="nav-link logout-button">
              Logout
            </button>
          ) : (
            <Link to="/Log_In" className="nav-link">
              Login / Registration
            </Link>
          )}
        </div>

        {/* Hamburger menu icon */}
        <div className="hamburger" onClick={handleToggleMenu}>
          ☰
        </div>

        {/* Conditional rendering of the hamburger menu when it's open */}
        {isMenuOpen && (
          <ul className="nav-menu-hamburger">
            <li>
              <Link to="/" className="nav-link-hamburger">
                Home Page
              </Link>
            </li>
            <li>
              <Link to="/Add_Donation" className="nav-link-hamburger">
                {isAdmin ? "Donation Match" : "Add Donation"}
              </Link>
            </li>
            <li>
              <Link to="/Donations_Search" className="nav-link-hamburger">
                Donations Search
              </Link>
            </li>
            <li>
              <Link to="/Settings" className="nav-link-hamburger">
                Settings
              </Link>
            </li>
            <li>
              <Link to="/Connect_Us" className="nav-link-hamburger">
                Connect Us
              </Link>
            </li>
            <li>
              <Link to="/Messages" className="nav-link-hamburger">
                Messages
              </Link>
            </li>
            <li>
              <Link to="/About_Me" className="nav-link-hamburger">
                About Me
              </Link>
            </li>
            {user ? (
              <li>
                <Link
                  to="/"
                  className="nav-link-hamburger"
                  onClick={handleLogout}
                >
                  Logout
                </Link>
              </li>
            ) : (
              <li>
                <Link to="/Log_In" className="nav-link-hamburger-in">
                  Login / Registration
                </Link>
              </li>
            )}
          </ul>
        )}
      </nav>
    </div>
  );
}
