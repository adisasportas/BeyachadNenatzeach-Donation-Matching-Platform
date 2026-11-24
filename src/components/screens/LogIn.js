import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../screensCSS/LogIn.css";
import { useAuth } from "../../services/contexts/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  getFirestore,
} from "firebase/firestore";

const LogIn = () => {
  // State variables to manage form data and component behavior.
  const [email, setEmail] = useState(""); // State to store the user's email address.
  const [password, setPassword] = useState(""); // State to store the user's password.
  const navigate = useNavigate(); // Hook to enable programmatic navigation.
  const { auth } = useAuth(); // Get the auth object from the AuthContext.
  const db = getFirestore(); // Initialize Firestore instance.

  // Function to handle form submission and user login.
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior.
    try {
      // Sign in the user with email and password using Firebase Auth.
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user; // Get the user object from the user credentials.

      // Get the user's ID token and update the user object with the token.
      const token = await user.getIdToken(true);
      user.accessToken = token;

      // Save the updated user object with the token to localStorage.
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Query Firestore to check if the user exists in the "users" collection.
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Firebase Auth has already verified the password above, so the
        // user is authenticated once their profile document exists.
        alert("Welcome!"); // Show a welcome message.
        navigate("/"); // Navigate to the home page.
      } else {
        alert("User not found in Firestore."); // Show an error if the user is not found in Firestore.
      }
    } catch (error) {
      console.error("Error logging in:", error); // Log any errors that occur during login.
      alert("Invalid login credentials."); // Show an error if the login fails.
    }
  };

  // Function to navigate to the registration page when the registration button is clicked.
  const handleRegistrationClick = () => {
    navigate("/Registertion"); // Navigate to the registration page.
  };

  return (
    <div className="login-container">
      {/* Form container for user login */}
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>User Login</h2> {/* Form title */}
        <div className="input-container">
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />{" "}
          {/* Input field for the user's email */}
        </div>
        <div className="input-container">
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />{" "}
          {/* Input field for the user's password */}
        </div>
        <button type="submit" className="login-button">
          Login
        </button>{" "}
        {/* Button to submit the form and log in */}
        <button
          type="button"
          className="reg-button"
          onClick={handleRegistrationClick}
        >
          Registration
        </button>{" "}
        {/* Button to navigate to the registration page */}
      </form>
      <div className="text-login">
        <p>
          Now is the perfect opportunity for you to open your heart and make a
          donation to families in need. Your contribution can make a significant
          difference, without requiring you to spend large sums. A donation can
          improve the daily lives of those who need our help. If you've always
          wanted to assist but didn't know where to donate, our organization
          supports families and teenagers struggling with life's challenges.
        </p>
        <p>
          We believe in sincere donations that make a difference both
          immediately and over the long term. To achieve this, we operate aid
          centers in various regions across the country, ensuring that families
          receive food baskets and baby products monthly. In addition, our
          centers offer assistance with clothing and footwear, furniture,
          financial matters, legal aid, and—equally important—mental support,
          providing an attentive ear around the clock.
        </p>{" "}
        {/* Information text about the organization's mission and donation appeal */}
      </div>
    </div>
  );
};

export default LogIn; // Export the LogIn component as the default export
