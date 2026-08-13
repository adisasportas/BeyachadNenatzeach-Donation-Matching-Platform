import React from "react";
import "../screensCSS/Registertion.css";
import { firebase, auth } from "../../services/firebase/FireStore";
import {
  getDocs,
  collection,
  setDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";

const Registration = () => {
  // Destructure methods from useForm for handling form state, validation, and submission.
  const {
    register, // Method to register form fields for validation.
    handleSubmit, // Method to handle form submission.
    formState: { errors }, // Destructure errors object from form state to handle validation errors.
    getValues, // Method to get current form values.
    reset, // Method to reset the form.
  } = useForm();
  const navigate = useNavigate(); // Initialize useNavigate to redirect users after form submission.
  const usersCollectionReference = collection(firebase, "users"); // Reference the "users" collection in Firestore.
  const encryptionKey = "123"; // Define the encryption key for encrypting passwords.

  // Function to check if a user with the given email or username already exists.
  const checkUserExists = async (email, userName) => {
    // Query Firestore to check for a user with the given email.
    const emailQuery = query(
      usersCollectionReference,
      where("email", "==", email)
    );
    // Query Firestore to check for a user with the given username.
    const userNameQuery = query(
      usersCollectionReference,
      where("userName", "==", userName)
    );

    const emailSnapshot = await getDocs(emailQuery); // Get the documents matching the email query.
    const userNameSnapshot = await getDocs(userNameQuery); // Get the documents matching the username query.

    // Return true if either query returns a result, indicating the user already exists.
    return !emailSnapshot.empty || !userNameSnapshot.empty;
  };

  // Function to create a new user in Firebase Auth and Firestore.
  const createUser = async (formData) => {
    try {
      // Check if a user with the same email or username already exists.
      const userExists = await checkUserExists(
        formData.email,
        formData.userName
      );

      if (userExists) {
        // If the user exists, display an error notification.
        toast.error(
          "User with this email or username already exists. Please try again."
        );
      } else {
        // Create a new user in Firebase Auth with email and password.
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const firebaseUser = userCredential.user; // Get the Firebase user object.

        // Encrypt the password before saving it to Firestore.
        const encryptedPassword = CryptoJS.AES.encrypt(
          formData.password,
          encryptionKey
        ).toString();

        // Encrypt the confirm password before saving it to Firestore.
        const encryptedConfirmPassword = CryptoJS.AES.encrypt(
          formData.confirmPassword,
          encryptionKey
        ).toString();

        // Create a new user object with the form data and encrypted passwords.
        const newUser = {
          ...formData, // Spread the form data.
          id: firebaseUser.uid, // Add the Firebase user ID.
          email: formData.email,
          userName: formData.userName,
          fullName: formData.fullName,
          phone: formData.phone,
          district: formData.district,
          password: encryptedPassword, // Save the encrypted password.
          confirmPassword: encryptedConfirmPassword, // Save the encrypted confirm password.
        };

        // Save the new user document in the "users" collection in Firestore.
        await setDoc(doc(usersCollectionReference, firebaseUser.uid), newUser);

        // Display a success notification.
        toast.success("New user created successfully!");
        reset(); // Reset the form fields.

        // Redirect the user to the home page after a 2-second delay.
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (e) {
      console.error("Error adding document:", e); // Log any errors that occur.
      toast.error("An error occurred while creating the user."); // Display an error notification.
    }
  };

  return (
    <div className="Registration">
      <ToastContainer /> {/* Container for displaying Toast notifications */}
      <div className="registration-container">
        <form className="registration-form" onSubmit={handleSubmit(createUser)}>
          <h2>Create New User</h2> {/* Form title */}
          <div className="form-columns">
            <div className="left-column">
              {/* Input field for the full name */}
              <div className="input-group">
                <input
                  {...register("fullName", {
                    required: true,
                    validate: (value) => {
                      const nameParts = value.trim().split(" ");
                      return (
                        nameParts.length >= 2 && // Full name must contain at least two words.
                        nameParts.every((part) => part.length >= 2) // Each word must be at least two letters.
                      );
                    },
                  })}
                  type="text"
                  placeholder="Full Name"
                />
                {errors.fullName && (
                  <div className="error-message">
                    * Full name must contain at least two words with at least
                    two letters each.
                  </div> // Display an error message if validation fails.
                )}
              </div>

              {/* Input field for the username */}
              <div className="input-group">
                <input
                  {...register("userName", { required: true, minLength: 2 })}
                  type="text"
                  placeholder="User Name"
                />
                {errors.userName && (
                  <div className="error-message">
                    * Enter valid user name (min 2 chars)
                  </div> // Display an error message if validation fails.
                )}
              </div>

              {/* Input field for the phone number */}
              <div className="input-group">
                <input
                  {...register("phone", {
                    required: true, // Phone number is required.
                    validate: (value) => value.length === 10, // Phone number must be exactly 10 digits.
                  })}
                  type="text"
                  placeholder="Phone Number"
                />
                {errors.phone && (
                  <div className="error-message">
                    * Phone number must be exactly 10 digits.
                  </div> // Display an error message if validation fails.
                )}
              </div>

              {/* Input field for the email address */}
              <div className="input-group">
                <input
                  {...register("email", {
                    required: true,
                    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, // Email must follow a valid pattern.
                  })}
                  type="email"
                  placeholder="Email Address"
                />
                {errors.email && (
                  <div className="error-message">* Enter valid email</div> // Display an error message if validation fails.
                )}
              </div>
            </div>
            <div className="right-column">
              {/* Input field for the password */}
              <div className="input-group">
                <input
                  {...register("password", {
                    required: true, // Password is required.
                    minLength: 8, // Password must be at least 8 characters long.
                    pattern:
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    // Password must contain upper and lower case letters, a number, and a special character.
                  })}
                  type="password"
                  placeholder="Password"
                />
                {errors.password && (
                  <div className="error-message">
                    * Password must be at least 8 characters, include upper and
                    lower case letters, a number, and a special character.
                  </div> // Display an error message if validation fails.
                )}
              </div>

              {/* Input field for confirming the password */}
              <div className="input-group">
                <input
                  {...register("confirmPassword", {
                    required: true, // Confirm password is required.
                    validate: (value) => value === getValues("password"), // Passwords must match.
                  })}
                  type="password"
                  placeholder="Confirm Password"
                />
                {errors.confirmPassword && (
                  <div className="error-message">* Passwords do not match</div> // Display an error message if validation fails.
                )}
              </div>

              {/* Radio button group for selecting the user's district */}
              <div className="district-group">
                <label>
                  <input
                    {...register("district", { required: true })} // District is required.
                    type="radio"
                    value="Center District"
                  />
                  Center District
                </label>
                <label>
                  <input
                    {...register("district", { required: true })}
                    type="radio"
                    value="North District"
                  />
                  North District
                </label>
                <label>
                  <input
                    {...register("district", { required: true })}
                    type="radio"
                    value="South District"
                  />
                  South District
                </label>
                <label>
                  <input
                    {...register("district", { required: true })}
                    type="radio"
                    value="Jerusalem District"
                  />
                  Jerusalem District
                </label>
                <label>
                  <input
                    {...register("district", { required: true })}
                    type="radio"
                    value="Eilat District"
                  />
                  Eilat District
                </label>
                {errors.district && (
                  <div className="error-message">
                    * Please select a district
                  </div> // Display an error message if validation fails.
                )}
              </div>
            </div>
          </div>
          <button type="submit" className="save-button">
            ADD NEW USER
          </button>{" "}
          {/* Submit button to add the new user */}
        </form>
      </div>
    </div>
  );
};

export default Registration; // Export the Registration component as the default export.
