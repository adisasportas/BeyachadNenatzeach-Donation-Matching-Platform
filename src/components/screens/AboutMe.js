import React, { useState, useEffect } from "react";
import "../screensCSS/AboutMe.css"; // Ensure this is the correct path to your CSS file
import {
  getFirestore,
  doc,
  onSnapshot,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useUser } from "../../services/contexts/UserContext"; // Correct path to the context
import { RxSwitch } from "react-icons/rx"; // Import the icon

// The AboutMe component displays and allows editing of the "About Me" section for admin users.
const AboutMe = () => {
  const { user: currentUser } = useUser(); // Access the current user from the user context
  const [isAdmin, setIsAdmin] = useState(false); // State to track if the current user is an admin
  const [editing, setEditing] = useState(false); // State to track if the edit mode is active
  const [aboutText, setAboutText] = useState(""); // State to store the "About Me" text
  const [newAboutText, setNewAboutText] = useState(""); // State to store the new text while editing

  // useEffect to fetch initial data and set up real-time updates
  useEffect(() => {
    if (!currentUser) {
      console.error("Current user is not defined"); // Logs an error if the current user is not defined
      return;
    }

    console.log("Current User:", currentUser); // Debug log for the current user

    const db = getFirestore(); // Initialize Firestore
    const aboutMeRef = doc(db, "aboutMe", "aboutText"); // Reference to the "aboutText" document in the "aboutMe" collection
    const userRef = doc(db, "users", currentUser.id || currentUser.uid); // Reference to the current user's document, checking both id and uid

    console.log("About Me Ref:", aboutMeRef); // Debug log for the "aboutMe" document reference
    console.log("User Ref:", userRef); // Debug log for the user document reference

    // Function to fetch initial data for the user and "About Me" text
    const fetchInitialData = async () => {
      try {
        const userSnap = await getDoc(userRef); // Fetch the user document
        if (userSnap.exists()) {
          const userData = userSnap.data(); // Extract user data
          console.log("User Data:", userData); // Debug log for user data
          if (userData.userName === "admin" && userData.fullName === "admin") {
            setIsAdmin(true); // Set the user as admin if both username and fullname are "admin"
          }
        } else {
          console.log("No such user document!"); // Log if the user document does not exist
        }

        const aboutMeSnap = await getDoc(aboutMeRef);  // Fetch the "About Me" document
        if (aboutMeSnap.exists()) {
          setAboutText(aboutMeSnap.data().text); // Set the "About Me" text if the document exists
        } else {
          console.log("No such aboutMe document!"); // Log if the "About Me" document does not exist
        }
      } catch (error) {
        console.error("Error fetching initial data:", error); // Log any errors that occur during data fetching
      }
    };

    fetchInitialData(); // Call the function to fetch initial data

    // Set up a real-time listener for changes to the "About Me" document
    const unsubscribeAboutMe = onSnapshot(aboutMeRef, (docSnap) => {
      if (docSnap.exists()) {
        setAboutText(docSnap.data().text); // Update the "About Me" text in real-time if the document exists
      } else {
        console.log("No such document!"); // Log if the document does not exist
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribeAboutMe();
  }, [currentUser]); // This effect runs whenever the current user changes

  // Function to handle when the edit button is clicked
  const handleEditClick = () => {
    setNewAboutText(aboutText); // Set the new text to the current "About Me" text
    setEditing(true); // Enable edit mode
  };

  // Function to handle when the save button is clicked
  const handleSaveClick = async () => {
    const db = getFirestore(); // Initialize Firestore
    const aboutMeRef = doc(db, "aboutMe", "aboutText"); // Reference to the "aboutText" document in the "aboutMe" collection
    await setDoc(aboutMeRef, { text: newAboutText }); // Save the new "About Me" text to Firestore
    setAboutText(newAboutText); // Update the state with the new text
    setEditing(false); // Exit edit mode
  };

  return (
    <div className="about-me-container">
      <div className="about-me-content">
        <h2>About Me</h2>
        {editing ? (
          <textarea
            className="edit-textarea"
            value={newAboutText}
            onChange={(e) => setNewAboutText(e.target.value)} // Update the new text as the user types
          />
        ) : (
          aboutText.split("\n").map((line, index) => <p key={index}>{line}</p>) // Display the "About Me" text with line breaks
        )}
        {isAdmin && (
          <div
            className="admin-buttons"
            style={{
              top: "-15px",
              left: "-500px",
              position: "absolute",
            }}
          >
            {!editing && (
              <button className="edit-mode-btn" onClick={handleEditClick}>
                <RxSwitch /> {/* Edit button with a switch icon */}
              </button>
            )}
            {editing && (
              <button className="save-btn" onClick={handleSaveClick}>
                Save {/* Save button when in edit mode */}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutMe; // Export the AboutMe component as the default export
