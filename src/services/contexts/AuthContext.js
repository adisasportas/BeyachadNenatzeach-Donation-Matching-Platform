import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/FireStore";

const AuthContext = createContext(null); // Creating a context for authentication

// AuthProvider component to provide authentication state and methods to the rest of the app
export const AuthProvider = ({ children }) => {
  // State to keep track of the current user
  const [currentUser, setCurrentUser] = useState(() => {
    // Retrieve the current user from localStorage if available
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null; // Initialize state with the saved user or null
  });

  // useEffect to handle authentication state changes
  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // If a user is logged in, refresh the token to ensure it's up-to-date
        const token = await user.getIdToken(true); // Refresh the token
        user.accessToken = token; // Update the user object with the new token

        // Check if the user in localStorage is different from the current user
        const storedUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!storedUser || storedUser.accessToken !== token) {
          // If different, update localStorage with the new user data
          localStorage.setItem("currentUser", JSON.stringify(user));
        }

        setCurrentUser(user); // Update the currentUser state with the user object
      } else {
        // If no user is logged in, clear the state and localStorage
        setCurrentUser(null);
        localStorage.removeItem("currentUser");
      }
    });

    // Cleanup function to unsubscribe from the auth state listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this effect runs only on mount and unmount

  // Function to log the user out
  const logout = () => {
    signOut(auth)
      .then(() => {
        // On successful sign out, clear the currentUser state and localStorage
        setCurrentUser(null);
        localStorage.clear();
      })
      .catch((error) => {
        // Handle any errors that occur during sign out
        console.error("Error during sign out:", error);
      });
  };

  // Providing the currentUser, setCurrentUser, auth, and logout functions through context
  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, auth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext in other components
export const useAuth = () => useContext(AuthContext);
