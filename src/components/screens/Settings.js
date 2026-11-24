import React, { useState, useEffect } from "react";
import "../screensCSS/Settings.css";
import { firebase } from "../../services/firebase/FireStore";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  getDocs,
  collection,
  deleteField,
} from "firebase/firestore";
import { useUser } from "../../services/contexts/UserContext";
import { getAuth, deleteUser, updatePassword } from "firebase/auth";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { isAdmin as isAdminUser } from "../../services/admin";

// Removes password fields so they are never shown or written to Firestore.
// Older accounts may still have them stored; `deleteField()` clears them.
const stripPasswords = ({ password, confirmPassword, ...rest }) => rest;
const clearLegacyPasswords = {
  password: deleteField(),
  confirmPassword: deleteField(),
};

function Settings() {
  // Component-level state management
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    district: "",
    subscribe: false,
  }); // State to store the profile information of the current user.
  const [searchEmail, setSearchEmail] = useState(""); // State to store the email input for searching users.
  const [searchedUser, setSearchedUser] = useState(null); // State to store the details of the searched user.
  const { user } = useUser(); // Get the current user from the useUser context.
  const [isAdmin, setIsAdmin] = useState(false); // State to determine if the current user is an admin.
  const [showPassword, setShowPassword] = useState(false); // State to manage the visibility of the password.
  const auth = getAuth(); // Get the authentication object.

  // Function to fetch the profile data of the current user from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user.docId) {
        console.error("No document ID found in user context");
        return;
      }

      try {
        const userDocRef = doc(firebase, "users", user.docId); // Reference the user's document in Firestore.
        const docSnap = await getDoc(userDocRef); // Fetch the user's document.
        if (docSnap.exists()) {
          const userData = docSnap.data(); // Get the user data from the document.
          // The password fields start empty: they are only for setting a new password.
          setProfile((prevProfile) => ({
            ...prevProfile,
            ...stripPasswords(userData),
            password: "",
            confirmPassword: "",
          }));

          setIsAdmin(isAdminUser(docSnap.id));
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchProfile(); // Call the fetchProfile function to retrieve the user's profile data.
  }, [user]); // Re-run the useEffect when the user changes.

  // Function to handle input changes in the profile form
  const handleChange = (e) => {
    // Destructure the event target to get the name, value, type, and checked properties.
    const { name, value, type, checked } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: type === "checkbox" ? checked : value,
    })); // Update the corresponding field in the profile state.
  };

  // Function to handle form submission for updating the user's profile
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior.
    if (!user.docId) {
      console.error("No document ID found in user context");
      return;
    }

    // A new password is optional; when given it is changed in Firebase Auth only.
    if (profile.password || profile.confirmPassword) {
      if (profile.password !== profile.confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
      if (profile.password.length < 8) {
        alert("Password must be at least 8 characters.");
        return;
      }
    }

    const userDocRef = doc(firebase, "users", user.docId); // Reference the user's document in Firestore.

    try {
      if (profile.password) {
        await updatePassword(auth.currentUser, profile.password);
      }
      // Save the profile without passwords, and clear any legacy stored copy.
      await updateDoc(userDocRef, {
        ...stripPasswords(profile),
        ...clearLegacyPasswords,
      });
      setProfile((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      alert("Profile updated successfully!"); // Show a success alert.
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.code === "auth/requires-recent-login") {
        alert("For security, please log out and log in again before changing your password.");
      } else {
        alert("Failed to update profile. Please try again."); // Show an error alert if the update fails.
      }
    }
  };

  // Function to generate an Excel report of users by district
  const handleGenerateExcelReport = async () => {
    try {
      const querySnapshot = await getDocs(collection(firebase, "users")); // Fetch all user documents from the "users" collection.
      const districtCounts = {}; // Initialize an object to count users by district.

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const district = userData.district;
        if (district) {
          if (districtCounts[district]) {
            districtCounts[district]++;
          } else {
            districtCounts[district] = 1;
          }
        }
      }); // Iterate over each user document and count the number of users in each district.

      const data = Object.keys(districtCounts).map((district) => ({
        District: district,
        Count: districtCounts[district],
      })); // Convert the districtCounts object into an array for Excel.

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "District Report"); // Create an Excel worksheet and workbook and append the data.

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(blob, "DistrictReport.xlsx"); // Convert the Excel data to a blob and save it as a file.

      alert("Excel report generated successfully!"); // Show a success alert.
    } catch (error) {
      console.error("Error generating Excel report:", error);
      alert("Failed to generate report. Please try again."); // Show an error alert if the report generation fails.
    }
  };

  // Function to search for a user by email
  const handleSearch = async () => {
    try {
      const q = query(
        collection(firebase, "users"),
        where("email", "==", searchEmail)
      ); // Create a query to find a user with the specified email.
      const querySnapshot = await getDocs(q); // Execute the query and get the matching documents.

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data(); // Get the user data from the first matching document.
        setSearchedUser({
          docId: querySnapshot.docs[0].id,
          ...stripPasswords(userData),
        }); // Update the searchedUser state with the found user's data.
      } else {
        // Show an alert if no user is found and reset the searchedUser state.
        alert("No user found with this email");
        setSearchedUser(null);
      }
    } catch (error) {
      console.error("Error searching for user:", error);
      alert("Failed to search for user. Please try again."); // Show an error alert if the search fails.
    }
  };

  // Function to update the searched user's information
  const handleUpdateSearchedUser = async () => {
    if (!searchedUser || !searchedUser.docId) {
      console.error("No document ID found for the searched user");
      return;
    }

    // Reference the document of the searched user in Firestore.
    const userDocRef = doc(firebase, "users", searchedUser.docId);

    try {
      const { docId, ...fields } = searchedUser;
      await updateDoc(userDocRef, {
        ...stripPasswords(fields),
        ...clearLegacyPasswords,
      }); // Update the user's document with the new data.
      alert("User updated successfully!"); // Show a success alert.
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user. Please try again."); // Show an error alert if the update fails.
    }
  };

  // Function to delete the searched user from Firestore and log the deletion
  const handleDeleteUser = async () => {
    if (!searchedUser || !searchedUser.docId) {
      alert("No user selected for deletion.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    ); // Show a confirmation dialog before deleting.

    if (confirmDelete) {
      try {
        const userDocRef = doc(firebase, "users", searchedUser.docId);
        await deleteDoc(userDocRef); // Delete the user's document from Firestore.

        const deletedUserDocRef = doc(collection(firebase, "deletedUsers"));
        await setDoc(deletedUserDocRef, {
          ...stripPasswords(searchedUser),
          deletedAt: new Date().toISOString(),
        }); // Log the deletion by creating a document in the "deletedUsers" collection.

        alert("User deleted and added to deleted users list successfully!");
        setSearchedUser(null); // Show a success alert and reset the searchedUser state.
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user. Please try again."); // Show an error alert if the deletion fails.
      }
    }
  };

  // Function to delete the current user's account from Firestore and Firebase Authentication
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account?"
    ); // Show a confirmation dialog before deleting the account.

    if (confirmDelete) {
      try {
        const userDocRef = doc(firebase, "users", user.docId);
        await deleteDoc(userDocRef); // Delete the current user's document from Firestore.

        const currentUser = auth.currentUser;
        if (currentUser) {
          await deleteUser(currentUser); // Delete the current user from Firebase Authentication.
        } else {
          throw new Error("No authenticated user found");
        }

        alert("Account deleted successfully!");
        auth.signOut();
        window.location.href = "/"; // Show a success alert, sign out the user, and redirect to the homepage.
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Failed to delete account. Please try again."); // Show an error alert if the deletion fails.
      }
    }
  };

  // Function to generate an Excel report of donations made in the current month
  const handleGenerateDonationReport = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // Get the start date of the current month.

      const donationCountsByCategory = {
        mooving: 0,
        food: 0,
        financialContribution: 0,
        equipment: 0,
        trump: 0,
      }; // Initialize an object to count donations by category.

      const querySnapshot = await getDocs(
        collection(firebase, "DataDonations")
      ); // Fetch all donation documents from the "DataDonations" collection.

      querySnapshot.forEach((doc) => {
        const donationData = doc.data();
        const createdAt = new Date(donationData.createdAt);
        const category = donationData.category;

        if (createdAt >= startOfMonth && createdAt <= now) {
          if (category in donationCountsByCategory) {
            donationCountsByCategory[category]++;
          }
        }
      }); // Iterate over each donation document and count donations by category if they were made in the current month.

      const data = Object.keys(donationCountsByCategory).map((category) => ({
        Category: category,
        Count: donationCountsByCategory[category],
      })); // Convert the donationCountsByCategory object into an array for Excel.

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      // Create an Excel worksheet and workbook and append the data.
      XLSX.utils.book_append_sheet(workbook, worksheet, "Donation Report");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(blob, "DonationReport.xlsx"); // Convert the Excel data to a blob and save it as a file.

      alert("Donation report generated successfully!"); // Show a success alert.
    } catch (error) {
      console.error("Error generating donation report:", error);
      alert("Failed to generate donation report. Please try again."); // Show an error alert if the report generation fails.
    }
  };

  // Function to generate an Excel report of donations made by each user
  const handleGenerateUserDonationReport = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(firebase, "DataDonations")
      );
      const usersSnapshot = await getDocs(collection(firebase, "users")); // Fetch all donation and user documents from Firestore.

      const usersMap = {}; // Create a mapping of users by their ID.
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        usersMap[doc.id] = {
          fullName: userData.fullName,
          phone: userData.phone,
          email: userData.email,
        };
      }); // Iterate over each user document and add it to the usersMap.

      const data = [];

      querySnapshot.forEach((doc) => {
        const donationData = doc.data();
        const userId = donationData.idUser;
        const user = usersMap[userId];

        if (user) {
          data.push({
            UserName: user.fullName || "Unknown",
            Phone: user.phone || "Unknown",
            Email: user.email || "Unknown",
            Category: donationData.category || "Unknown",
          });
        }
      }); // Iterate over each donation document and match it to a user from the usersMap, then add the data to the array.

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      // Create an Excel worksheet and workbook and append the data.
      XLSX.utils.book_append_sheet(workbook, worksheet, "User Donation Report");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(blob, "UserDonationReport.xlsx"); // Convert the Excel data to a blob and save it as a file.

      alert("User donation report generated successfully!"); // Show a success alert.
    } catch (error) {
      console.error("Error generating user donation report:", error);
      alert("Failed to generate user donation report. Please try again."); // Show an error alert if the report generation fails.
    }
  };

  return (
    <div className="settings-page">
      <form className="settings-form" onSubmit={handleSubmit}>
        {!isAdmin && (
          <div>
            <div className="settings-row">
              <div className="settings-column">
                <div className="form-control">
                  <label htmlFor="fullName">Full Name:</label>
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-control">
                  <label htmlFor="password">New Password:</label>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={profile.password}
                    onChange={handleChange}
                    placeholder="Leave empty to keep current password"
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-control">
                  <label htmlFor="confirmPassword">Confirm New Password:</label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    name="confirmPassword"
                    value={profile.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-control">
                  <input
                    type="checkbox"
                    id="showPassword"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                  />
                  <label htmlFor="showPassword">Show Passwords</label>
                </div>
              </div>
              <div className="settings-column">
                <div className="form-control">
                  <label htmlFor="phone">Phone Number:</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-control">
                  <label htmlFor="email">Email Address:</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled
                  />
                </div>
                <div className="form-control">
                  <label htmlFor="district">District:</label>
                  <select
                    id="district"
                    name="district"
                    value={profile.district}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a district</option>
                    <option value="North District">North District</option>
                    <option value="Central District">Central District</option>
                    <option value="South District">South District</option>
                    <option value="Jerusalem District">
                      Jerusalem District
                    </option>
                    <option value="Eilat District">Eilat District</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="save-button">
                Save
              </button>
              <button
                type="button"
                className="delete-button"
                onClick={handleDeleteAccount}
              >
                Delete My Account
              </button>
            </div>
          </div>
        )}
        {isAdmin && (
          <div className="admin-section">
            <div className="admin-container">
              <div className="admin-details">
                <h3>Admin Details</h3>
                <div className="form-control">
                  <label htmlFor="adminEmail">Email:</label>
                  <input
                    id="adminEmail"
                    type="email"
                    value={user.email}
                    disabled
                  />
                </div>
                <div className="form-control">
                  <label htmlFor="adminUserName">Username:</label>
                  <input
                    id="adminUserName"
                    type="text"
                    value={user.userName}
                    disabled
                  />
                </div>
                <button
                  className="generate-report-button"
                  onClick={handleGenerateExcelReport}
                >
                  Generate Distric User Excel Report
                </button>
                <button
                  className="generate-report-button"
                  onClick={handleGenerateDonationReport}
                >
                  Generate Donation Excel Report
                </button>
                <button
                  className="generate-report-button"
                  onClick={handleGenerateUserDonationReport}
                >
                  Generate User Donation Report
                </button>
              </div>
              <div className="user-details">
                <div className="form-control">
                  <label htmlFor="searchEmail">Search User by Email:</label>
                  <input
                    id="searchEmail"
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                  <button type="button" onClick={handleSearch}>
                    Search
                  </button>
                </div>
                {searchedUser && (
                  <div className="searched-user">
                    <h3>User Details</h3>
                    <div className="form-control">
                      <label htmlFor="searchedFullName">Full Name:</label>
                      <input
                        id="searchedFullName"
                        type="text"
                        name="fullName"
                        value={searchedUser.fullName}
                        onChange={(e) =>
                          setSearchedUser({
                            ...searchedUser,
                            fullName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-control">
                      <label htmlFor="searchedEmail">Email:</label>
                      <input
                        id="searchedEmail"
                        type="email"
                        name="email"
                        value={searchedUser.email}
                        onChange={(e) =>
                          setSearchedUser({
                            ...searchedUser,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-control">
                      <label htmlFor="searchedPhone">Phone Number:</label>
                      <input
                        id="searchedPhone"
                        type="tel"
                        name="phone"
                        value={searchedUser.phone}
                        onChange={(e) =>
                          setSearchedUser({
                            ...searchedUser,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-control">
                      <label htmlFor="searchedDistrict">District:</label>
                      <select
                        id="searchedDistrict"
                        name="district"
                        value={searchedUser.district}
                        onChange={(e) =>
                          setSearchedUser({
                            ...searchedUser,
                            district: e.target.value,
                          })
                        }
                      >
                        <option value="">Select a district</option>
                        <option value="North District">North District</option>
                        <option value="Center District">
                          Central District
                        </option>
                        <option value="South District">South District</option>
                        <option value="Jerusalem District">
                          Jerusalem District
                        </option>
                        <option value="Eilat District">Eilat District</option>
                      </select>
                    </div>
                    <div className="form-actions">
                      <button type="button" onClick={handleUpdateSearchedUser}>
                        Update
                      </button>
                      <button type="button" onClick={handleDeleteUser}>
                        Delete User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default Settings;
