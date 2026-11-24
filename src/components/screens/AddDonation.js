import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../services/contexts/UserContext";
import { useAuth } from "../../services/contexts/AuthContext";
import "../screensCSS/AddDonation.css";
import { storage, firebase } from "../../services/firebase/FireStore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { matchDonations } from "../../components/algorithem/MatchDonations";
import { getFirestore, getDocs } from "firebase/firestore";
import { isAdmin as isAdminUser } from "../../services/admin";

// The AddDonation component handles the creation of new donations and the matching process for admins.
function AddDonation() {
  // State to manage the donation form data
  const [donation, setDonation] = useState({
    title: "", // Title of the donation item.
    description: "", // Description of the donation item.
    district: "", // District where the donation is located.
    category: "", // Category of the donation item (e.g., food, equipment).
    productStatus: "", // Status of the product (used, not used).
    imagePreview: null, // URL for previewing the uploaded image.
    imageFile: null, // File object of the uploaded image.
    imageName: null, // Name of the uploaded image file.
  });

  const { user } = useUser(); // Access the current user from the UserContext
  const navigate = useNavigate(); // Hook to navigate between routes
  const { currentUser } = useAuth(); // Access the current authenticated user from the AuthContext
  const [isAdmin, setIsAdmin] = useState(false); // State to track if the current user is an admin
  const [matches, setMatches] = useState([]); // State to store the list of donation matches
  const [expandedOrg, setExpandedOrg] = useState(null); // State to store the list of donation matches
  const [usernames, setUsernames] = useState({}); // State to store usernames mapped by user ID
  const [donationTypes, setDonationTypes] = useState([]); // State to store donation types

  // useEffect to check if the user is authenticated and an admin
  useEffect(() => {
    if (!user) {
      navigate("/Log_In"); // If no user is found, navigate to the login page
    } else {
      setIsAdmin(isAdminUser(currentUser || user));
    }
  }, [user, currentUser, navigate]); // The effect runs whenever the user or currentUser changes

  // Function to handle changes in the donation form inputs
  const handleChange = (e) => {
    const { name, value } = e.target; // Destructuring the event target to get name and value.
    setDonation((prevDonation) => ({
      ...prevDonation, // Spread the previous donation state.
      [name]: value, // Update the specific field with the new value.
    })); // Update the corresponding field in the donation state
  };

  // Function to handle image file changes in the donation form
  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      // Check if a file has been selected.
      try {
        const token = await currentUser.getIdToken(true); // Update the user's ID token
        currentUser.accessToken = token; // Set the accessToken in the currentUser
        localStorage.setItem("currentUser", JSON.stringify(currentUser)); // Store the updated currentUser in localStorage

        const file = e.target.files[0]; // Get the selected file
        setDonation((prevDonation) => ({
          ...prevDonation, // Spread the previous donation state.
          imagePreview: URL.createObjectURL(file), // Create a preview URL for the selected image
          imageFile: file, // Store the selected file
          imageName: file.name, // Store the file name
        }));
      } catch (error) {
        console.error("Error updating token: ", error.message); // Log any error in token update
        alert("There was an issue updating the token. Please try again."); // Alert the user about the error
      }
    }
  };

  // Function to handle the removal of the selected image
  const handleRemoveImage = () => {
    setDonation((prevDonation) => ({
      ...prevDonation, // Spread the previous donation state.
      imagePreview: null, // Remove the image preview URL.
      imageFile: null, // Remove the image file object.
      imageName: null, // Remove the image name.
    })); // Clear the image data from the donation state
  };

  // Function to handle form submission for creating a new donation
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior.
    try {
      if (!currentUser) {
        console.error("User is not authenticated"); // Log an error if the user is not authenticated.
        throw new Error("User is not authenticated"); // Throw an error to stop the process.
      }

      const userUID = currentUser.uid; // Get the current user's UID
      let imageUrl = ""; // Initialize the imageUrl variable

      if (donation.imageFile) {
        // Check if an image file has been uploaded.
        const imageRef = ref(
          storage,
          `image/${userUID}/${Date.now()}_${donation.imageFile.name}`
        ); // Create a reference for the image file in Firebase Storage
        try {
          await uploadBytes(imageRef, donation.imageFile); // Upload the image file to Firebase Storage
          imageUrl = await getDownloadURL(imageRef); // Get the download URL of the uploaded image
          console.log("Image uploaded successfully:", imageUrl); // Log the successful image upload
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError.message); // Log any error during image upload
          alert("Error uploading image. Please try again."); // Alert the user about the upload error
          return;
        }
      } else {
        imageUrl = "default_image_url"; // Replace with your default image URL
      }

      const newDonation = {
        IdDonations: Date.now(), // Generate a unique ID for the donation
        category: donation.category, // Set the donation category.
        description: donation.description, // Set the donation description.
        district: donation.district, // Set the donation district.
        idUser: userUID, // Set the user ID of the donor.
        image: imageUrl, // Set the URL of the uploaded image.
        productStatus: donation.productStatus, // Set the product status.
        title: donation.title, // Set the donation title.
        createdAt: new Date().toISOString(), // Store the creation date as an ISO string
      };

      await addDoc(collection(firebase, "DataDonations"), newDonation); // Add the new donation to Firestore
      alert("Donation created successfully!"); // Alert the user about the successful creation
      navigate("/"); // Navigate back to the home page
    } catch (error) {
      console.error("Error creating donation: ", error.message, error.stack); // Log any error during donation creation
      alert(
        `Failed to create donation. Please try again. Error: ${error.message}`
      ); // Alert the user about the creation error
    }
  };

  // useEffect to fetch usernames for matched donations
  useEffect(() => {
    const fetchUsernames = async () => {
      const updatedUsernames = {}; // Initialize an object to store usernames.

      for (let matchGroup of matches) {
        // Iterate over each match group.
        for (let match of matchGroup.matches) {
          const userDoc = await getDoc(
            doc(firebase, "users", match.donor.idUser)
          ); // Get the user document for each donor.
          if (userDoc.exists()) {
            updatedUsernames[match.donor.idUser] = userDoc.data().userName; // Store the username in the updatedUsernames object.
          }
        }
      }

      setUsernames(updatedUsernames); // Update the usernames state with the fetched usernames.
    };

    fetchUsernames(); // Call the function to fetch usernames.
  }, [matches]); // The effect runs whenever the matches state changes.

  // Function to handle the donation matching process.
  const handleMatchCheck = async () => {
    try {
      const potentialMatches = await matchDonations(); // Get potential matches using the matchDonations function.

      const filteredMatches = []; // Initialize an array to store filtered matches.

      for (let matchGroup of potentialMatches) {
        let allDonationsCompleted = true; // Flag to track if all donations in the group are completed.

        for (let match of matchGroup.matches) {
          const doneDonationDoc = await getDoc(
            doc(firebase, "doneDonations", match.donor.id)
          ); // Check if the donation has already been completed.

          if (!doneDonationDoc.exists()) {
            allDonationsCompleted = false; // If any donation is not completed, set the flag to false.
            break; // Exit the loop as we found an incomplete donation.
          }
        }

        if (!allDonationsCompleted) {
          filteredMatches.push(matchGroup); // Add the match group to filteredMatches if not all donations are completed.
        }
      }

      setMatches(filteredMatches); // Update the matches state with the filtered matches.
    } catch (error) {
      console.error("Error checking matches: ", error); // Log any error that occurs during match checking.
    }
  };

  // Function to toggle the expansion of organization details.
  const toggleExpandOrg = (orgId) => {
    setExpandedOrg(expandedOrg === orgId ? null : orgId); // Toggle between expanding and collapsing the organization's details.
  };

  // Function to handle the deletion of an entire match group.
  const handleDeleteMatch = async (orgId) => {
    try {
      const matchGroup = matches.find((match) => match.org.id === orgId);

      await addDoc(collection(firebase, "deletedMatches"), {
        organization: matchGroup.org, // Add the organization details to the deleted matches collection.
        donors: matchGroup.matches.map((match) => match.donor), // Add the list of donors to the deleted matches collection.
        deletedAt: new Date(), // Record the deletion date.
      });

      setMatches((prevMatches) =>
        prevMatches.filter((matchGroup) => matchGroup.org.id !== orgId)
      ); // Remove the deleted match group from the state.

      alert("Match deleted successfully!"); // Show a success alert to the user.
    } catch (error) {
      console.error("Error deleting match: ", error.message); // Log any error that occurs during match deletion.
      alert(`Failed to delete match. Error: ${error.message}`); // Show an error alert to the user.
    }
  };

  // Function to handle marking a donation as completed.
  const handleMarkAsDone = async (donationId, orgId) => {
    try {
      const matchGroup = matches.find((match) => match.org.id === orgId); // Find the match group by organization ID.
      const donationDoc = doc(firebase, "DataDonations", donationId); // Get the reference to the donation document.
      const donationData = (await getDoc(donationDoc)).data(); // Get the donation data.

      await addDoc(collection(firebase, "doneDonations"), {
        ...donationData, // Spread the donation data into the new document.
        organization: matchGroup.org, // Add the organization details.
        completedAt: new Date(), // Record the completion date.
      });

      await deleteDoc(donationDoc); // Delete the original donation document from Firestore.

      // Remove the completed donor from the matchGroup
      const updatedMatches = matchGroup.matches.filter(
        (match) => match.donor.id !== donationId
      );

      if (updatedMatches.length === 0) {
        // If all donations are completed, remove the entire match group
        setMatches((prevMatches) =>
          prevMatches.filter((match) => match.org.id !== orgId)
        );
        alert("Entire match group completed and removed!"); // Show a success alert for the entire group's completion.
      } else {
        // Update the match group with remaining donations
        setMatches((prevMatches) =>
          prevMatches.map((match) =>
            match.org.id === orgId
              ? { ...match, matches: updatedMatches } // Update the match group with the remaining matches.
              : match
          )
        );
        alert("Donation marked as completed!"); // Show a success alert for the completed donation.
      }
    } catch (error) {
      console.error("Error marking donation as completed: ", error.message); // Log any error that occurs during marking as completed.
      alert(`Failed to mark donation as completed. Error: ${error.message}`); // Show an error alert to the user.
    }
  };

  // useEffect to remove empty match groups when the page loads or refreshes.
  useEffect(() => {
    setMatches((prevMatches) =>
      prevMatches.filter((matchGroup) => matchGroup.matches.length > 0)
    ); // Remove match groups that have no remaining donations.
  }, []);

  // Function to handle sending a message to a donor.
  const handleSendMessage = async (donation, organization) => {
    try {
      const messageId = Date.now(); // Generate a unique ID for the message.
      const messageContent = `Hi, you have been identified as a suitable donor for ${donation.title} to the organization ${organization.nameAssociations}. Organization district: ${organization.district}, Organization phone: ${organization.phone}. Please contact the organization to proceed with the donation. Kindly inform the system administrator once the donation has been completed.`;

      await addDoc(collection(firebase, "messages"), {
        id: messageId, // Set the unique ID for the message.
        message: messageContent, // Set the message content.
        read: false, // Mark the message as unread.
        receiverId: donation.idUser, // The user who should receive the message
        senderId: currentUser?.uid || user.id, // The admin who is sending the message.
        subject: `Donation match for ${organization.nameAssociations}`, // Set the subject of the message.
      });

      alert("Message sent successfully!"); // Show a success alert to the user.
    } catch (error) {
      console.error("Error sending message: ", error.message); // Log any error that occurs during message sending.
      alert(`Failed to send message. Error: ${error.message}`); // Show an error alert to the user.
    }
  };

  useEffect(() => {
    const fetchDonationTypes = async () => {
      const db = getFirestore(); // Connect to Firestore
      const donationTypesRef = collection(db, "donationTypes"); // Reference the collection

      try {
        const querySnapshot = await getDocs(donationTypesRef); // Fetch the documents
        const typesArray = querySnapshot.docs.map((doc) => doc.data()); // Map the data to an array
        setDonationTypes(typesArray); // Update the state with the fetched types
      } catch (error) {
        console.error("Error fetching donation types:", error); // Log any errors
      }
    };

    fetchDonationTypes(); // Call the function to fetch data
  }, []);

  return (
    <div className="donation-page">
      <div className="donation-container">
        {/* Conditionally render the title and form or the match check button based on admin status */}
        {!isAdmin && <h2>Create a New Donation</h2>}
        {isAdmin ? (
          <div className="save-button-wrapper">
            <button
              type="button"
              className="match-check-button"
              onClick={handleMatchCheck}
            >
              Check Matches
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="donation-form">
            <div className="columns-container">
              <div className="left-column">
                <select
                  name="category"
                  value={donation.category}
                  onChange={handleChange}
                  required
                  className="select-field"
                >
                  <option value="">Select a category</option>
                  {donationTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.title}{" "}
                      {/* Assuming "title" is the user-friendly display name */}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  name="title"
                  value={donation.title}
                  onChange={handleChange}
                  placeholder="Item name"
                  required
                  className="input-field"
                />
                {donation.category === "Item" && (
                  <select
                    name="productStatus"
                    value={donation.productStatus}
                    onChange={handleChange}
                    required
                    className="select-field"
                  >
                    <option value="">Select the product status</option>
                    <option value="used">Used</option>
                    <option value="not used">Not Used</option>
                  </select>
                )}
                <select
                  name="district"
                  value={donation.district}
                  onChange={handleChange}
                  required
                  className="select-field"
                >
                  <option value="">Choose a District</option>
                  <option value="Center District">Center District</option>
                  <option value="North District">North District</option>
                  <option value="South District">South District</option>
                  <option value="Jerusalem District">Jerusalem District</option>
                  <option value="Eilat District">Eilat District</option>
                </select>
              </div>
              <div className="right-column">
                <textarea
                  name="description"
                  value={donation.description}
                  onChange={handleChange}
                  placeholder="Description"
                  required
                  className="textarea-field"
                />
              </div>
            </div>
            <div className="image-upload-wrapper">
              <label htmlFor="image-upload" className="image-upload-label">
                <div className="upload-icon">+</div>
                <input
                  id="image-upload"
                  type="file"
                  name="image"
                  onChange={handleImageChange}
                  hidden
                />
              </label>
              {donation.imageName && (
                <div className="file-name">{donation.imageName}</div>
              )}
              {donation.imageName && (
                <button
                  type="button"
                  className="remove-image"
                  onClick={handleRemoveImage}
                >
                  Remove Image
                </button>
              )}
            </div>
            <div className="save-button-wrapper">
              <button type="submit" className="save-button">
                SAVE
              </button>
            </div>
          </form>
        )}

        {/* Matching section to display potential matches for admins */}
        <div className="matching-container">
          {matches.map((matchGroup, index) => (
            <div
              key={index}
              className={`org-box ${
                expandedOrg === matchGroup.org.id ? "expanded" : ""
              }`}
              onClick={() => toggleExpandOrg(matchGroup.org.id)}
            >
              <div className="org-summary small-box">
                <h4 style={{ marginBottom: "5px" }}>
                  {matchGroup.org.nameAssociations}
                </h4>
              </div>
              {expandedOrg === matchGroup.org.id && (
                <div className="org-details expanded-box">
                  <p>District: {matchGroup.org.district}</p>
                  <p>
                    Donation Requests:{" "}
                    {matchGroup.org.donationRequest.join(", ")}
                  </p>
                  <div className="donors-section">
                    {matchGroup.matches.map(
                      (match, donorIndex) =>
                        match.donor && (
                          <div
                            key={donorIndex}
                            className={`donor-card ${
                              matchGroup.bestMatch.some(
                                (bestMatch) =>
                                  bestMatch.donor?.id === match.donor.id
                              )
                                ? "best-match"
                                : ""
                            }`}
                          >
                            <p>Donor: {usernames[match.donor.idUser]}</p>
                            <p>District: {match.donor.district}</p>
                            <p>Category: {match.donor.category}</p>
                            <p>
                              Description:{" "}
                              {match.donor.description ||
                                "No description provided"}
                            </p>
                            {matchGroup.bestMatch.some(
                              (bestMatch) =>
                                bestMatch.donor?.id === match.donor.id
                            ) && (
                              <p className="best-match-indicator">
                                ⭐ Best Match
                              </p>
                            )}
                            <div className="action-buttons">
                              <button
                                onClick={() =>
                                  handleMarkAsDone(
                                    match.donor.id,
                                    matchGroup.org.id
                                  )
                                }
                                className="mark-done-button"
                              >
                                Mark as Done
                              </button>
                              <button
                                onClick={() =>
                                  handleSendMessage(match.donor, matchGroup.org)
                                }
                                className="send-message-button"
                              >
                                Send Message
                              </button>
                            </div>
                          </div>
                        )
                    )}
                  </div>
                  <div className="match-delete-button-wrapper">
                    <button
                      onClick={() => handleDeleteMatch(matchGroup.org.id)}
                      className="match-delete-button"
                    >
                      Delete Entire Match
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AddDonation; // Export the AddDonation component as the default export
