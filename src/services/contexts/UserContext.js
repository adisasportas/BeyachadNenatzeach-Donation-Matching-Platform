import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firebase } from "../../services/firebase/FireStore"; // Adjust the path to your Firestore file

const UserContext = createContext(null); // Creating a context to manage user data

// UserProvider component to manage and provide user data to the rest of the app
export const UserProvider = ({ children }) => {
  const { currentUser } = useAuth(); // Access the current user from the AuthContext

  // State to store the user's Firestore data
  const [user, setUser] = useState(() => {
    try {
      // Attempt to retrieve the user data from localStorage
      const localUser = localStorage.getItem("user");
      return localUser ? JSON.parse(localUser) : currentUser; // Initialize state with the local user data or current user
    } catch (error) {
      console.log(error); // Log any errors that occur during retrieval
      return currentUser; // Fallback to currentUser if there's an error
    }
  });

  // A ref to track whether the user data has already been fetched
  const userFetchedRef = useRef(false);

  // useEffect to fetch the user's data from Firestore when currentUser changes
  useEffect(() => {
    const fetchUserData = async () => {
      // Only fetch data if currentUser exists and the data hasn't been fetched yet
      if (currentUser && !userFetchedRef.current) {
        // Query Firestore for the user document matching the current user's email
        const q = query(
          collection(firebase, "users"),
          where("email", "==", currentUser.email)
        );
        const querySnapshot = await getDocs(q);

        // If a user document is found, update the user state and localStorage
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]; // Assuming the first document is the correct one
          const userData = { docId: userDoc.id, ...userDoc.data() }; // Combine the document ID with the data
          setUser(userData); // Update the user state with the fetched data
          localStorage.setItem("user", JSON.stringify(userData)); // Save the user data to localStorage
        }
      }
    };

    fetchUserData(); // Call the function to fetch user data
  }, [currentUser]); // Dependency array ensures this effect runs when currentUser changes

  // useEffect to update localStorage whenever the user state changes
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user)); // Save the updated user data to localStorage
      } else {
        localStorage.removeItem("user"); // Remove the user data from localStorage if user is null
      }
    } catch (error) {
      console.log(error); // Log any errors that occur during this process
    }
  }, [user]); // Dependency array ensures this effect runs when user changes

  return (
    // Provide the user state and setUser function to any components that need it
    <UserContext.Provider value={{ user, setUser }}>
      {children}{" "}
      {/* Render the children components within the context provider */}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext in other components
export const useUser = () => useContext(UserContext);
