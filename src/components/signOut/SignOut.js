import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase/FireStore";

// The signOutFromLoggedUser function handles the user sign-out process and clears all relevant user data.
export const signOutFromLoggedUser = () => {
  return signOut(auth) // Initiates the sign-out process using the Firebase auth instance.
    .then(() => {
      // If the sign-out is successful, the following code is executed.
      localStorage.clear(); // Clears all data stored in the browser's LocalStorage (removes any user-related data).
      sessionStorage.clear(); // Clears all data stored in the browser's SessionStorage (removes session-specific data).

      alert("Signed out successfully"); // Displays a success message to the user indicating the sign-out was successful.
    })
    .catch((error) => {
      // If an error occurs during the sign-out process, this block is executed.
      alert(`An error occurred during sign-out: ${error.message}`); // Displays an alert to the user with the error message.
      console.error("Error during sign out:", error); // Logs the error to the browser's console for debugging purposes.
    });
};
