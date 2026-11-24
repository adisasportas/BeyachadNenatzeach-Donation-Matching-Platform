import React, { useState, useEffect } from "react";
import {
  getDocs,
  collection,
  getFirestore,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import "../screensCSS/SearchDonations.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../../services/contexts/UserContext";
import { RxSwitch } from "react-icons/rx";
import { useForm } from "react-hook-form";
import { isAdmin as isAdminUser } from "../../services/admin";

function SearchDonations() {
  const { user: currentUser } = useUser(); // Destructure the current user from the useUser context.
  const [associations, setAssociations] = useState([]); // State to store the list of associations fetched from Firestore.
  const [selectedAssoc, setSelectedAssoc] = useState(null); // State to store the currently selected association for viewing details.
  const [isAdmin, setIsAdmin] = useState(false); // State to determine if the current user is an admin.
  const [editMode, setEditMode] = useState(false); // State to toggle the edit mode on and off.
  const [showForm, setShowForm] = useState(false); // State to control the visibility of the form for adding/editing organizations.
  const [newAssoc, setNewAssoc] = useState({
    IdAssociations: Date.now(), // Unique ID for the new association.
    addressAssociations: "", // Address of the association.
    district: "", // District where the association is located.
    donationRequest: [], // List of donation requests by the association.
    information: "", // Additional information about the association.
    nameAssociations: "", // Name of the association.
    phoneAssociations: "", // Phone number of the association.
    riting: "", // Rating of the association.
  });
  const [editingAssoc, setEditingAssoc] = useState(false); // State to indicate if an association is being edited.
  const [editingDocId, setEditingDocId] = useState(null); // State to store the document ID of the association being edited.
  const {
    register, // Register function to register form fields for validation.
    handleSubmit, // Function to handle form submission.
    formState: { errors }, // Destructure errors object from form state to handle validation errors.
  } = useForm();
  const [showDonationTypeForm, setShowDonationTypeForm] = useState(false); // State for donation type form
  const [donationType, setDonationType] = useState({ name: "", title: "" }); // State for donation type data
  const [donationTypes, setDonationTypes] = useState([]);

  useEffect(() => {
    console.log("useEffect called with currentUser:", currentUser); // Log the current user when useEffect is called.

    // Function to check if the current user has admin rights
    setIsAdmin(isAdminUser(currentUser));

    // Function to fetch the list of associations from Firestore
    const fetchAssociations = async () => {
      console.log("Fetching associations"); // Log that associations are being fetched.
      const db = getFirestore(); // Initialize Firestore.
      const assocsRef = collection(db, "Associations"); // Reference the "Associations" collection in Firestore.

      try {
        const querySnapshot = await getDocs(assocsRef); // Get all documents from the "Associations" collection.
        const assocsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })); // Map the documents to an array of association objects.
        console.log("Associations fetched:", assocsArray); // Log the fetched associations.
        setAssociations(assocsArray); // Update the state with the fetched associations.
      } catch (error) {
        console.error("Error fetching associations:", error); // Log any errors that occur while fetching associations.
      }
    };

    fetchAssociations(); // Call the fetchAssociations function to get the list of associations.
  }, [currentUser]); // Re-run the useEffect when the currentUser changes.

  // Function to toggle the selection of an association for viewing details
  const toggleOpen = (assoc) => {
    setSelectedAssoc(assoc !== selectedAssoc ? assoc : null);
  }; // Toggle the selection of an association; if the same association is selected, deselect it.

  // Function to toggle the edit mode on and off
  const toggleEditMode = () => {
    setEditMode(!editMode);
  }; // Toggle the edit mode on and off.

  // Function to handle changes in form input fields for adding/editing an association
  const handleInputChange = (e) => {
    const { name, value } = e.target; // Destructure name and value from the event target.
    setNewAssoc((prev) => ({
      ...prev,
      [name]: value,
    })); // Update the corresponding field in newAssoc with the new value.
  };

  // Function to handle changes in the donation request checkboxes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target; // Destructure name and checked from the event target.
    setNewAssoc((prev) => {
      const updatedDonationRequest = checked
        ? [...prev.donationRequest, name] // Add the checkbox value to donationRequest if checked.
        : prev.donationRequest.filter((item) => item !== name); // Remove the checkbox value from donationRequest if unchecked.
      return {
        ...prev,
        donationRequest: updatedDonationRequest,
      }; // Update the donationRequest array in newAssoc.
    });
  };

  // Function to handle the addition of a new organization to Firestore
  const handleAddOrganization = async (e) => {
    const db = getFirestore(); // Initialize Firestore.
    try {
      await addDoc(collection(db, "Associations"), newAssoc); // Add the new organization to the "Associations" collection in Firestore.
      toast.success("Organization added successfully!"); // Display a success notification.
      setNewAssoc({
        IdAssociations: Date.now(),
        addressAssociations: "",
        district: "",
        donationRequest: [],
        information: "",
        nameAssociations: "",
        phoneAssociations: "",
        riting: "",
      }); // Reset the form fields after adding the organization.
      setShowForm(false); // Hide the form after submission.
      setEditingAssoc(false); // Reset the editing state.
      setEditingDocId(null); // Reset the document ID being edited.

      const querySnapshot = await getDocs(collection(db, "Associations"));
      const assocsArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAssociations(assocsArray); // Update the state with the new list of associations.
    } catch (error) {
      console.error("Error adding organization:", error); // Log any errors that occur while adding an organization.
      toast.error("Failed to add organization."); // Display an error notification if the addition fails.
    }
  };

  // Function to handle the deletion of an organization from Firestore
  const handleDeleteOrganization = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this organization?"
    ); // Show a confirmation dialog before deleting.
    if (confirmDelete) {
      // Proceed with deletion if the user confirms.
      const db = getFirestore(); // Initialize Firestore.
      try {
        await deleteDoc(doc(db, "Associations", id)); // Delete the organization document from Firestore.
        toast.success("Organization deleted successfully!"); // Display a success notification.
        setAssociations(associations.filter((assoc) => assoc.id !== id)); // Update the state by removing the deleted organization.
        setTimeout(() => {
          setSelectedAssoc(null); // Deselect the association after deletion.
        }, 1500);
      } catch (error) {
        console.error("Error deleting organization:", error); // Log any errors that occur while deleting the organization.
        toast.error("Failed to delete organization."); // Display an error notification if the deletion fails.
      }
    }
  };

  // Function to handle the update of an existing organization in Firestore
  const handleEditOrganization = async (e) => {
    const db = getFirestore(); // Initialize Firestore.
    try {
      const orgRef = doc(db, "Associations", editingDocId); // Reference the document of the organization being edited.
      await updateDoc(orgRef, newAssoc); // Update the organization document with the new data.
      toast.success("Organization updated successfully!"); // Display a success notification.
      setNewAssoc({
        IdAssociations: Date.now(),
        addressAssociations: "",
        district: "",
        donationRequest: [],
        information: "",
        nameAssociations: "",
        phoneAssociations: "",
        riting: "",
      }); // Reset the form fields after updating the organization.
      setShowForm(false); // Hide the form after submission.
      setEditingAssoc(false); // Reset the editing state.
      setEditingDocId(null); // Reset the document ID being edited.

      const querySnapshot = await getDocs(collection(db, "Associations"));
      const assocsArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAssociations(assocsArray); // Update the state with the new list of associations.
      setTimeout(() => {
        setSelectedAssoc(null); // Deselect the association after editing.
      }, 1500);
    } catch (error) {
      console.error("Error updating organization:", error); // Log any errors that occur while updating the organization.
      toast.error("Failed to update organization."); // Display an error notification if the update fails.
    }
  };

  // Function to handle the click event for editing an organization
  const handleEditButtonClick = (assoc) => {
    setNewAssoc(assoc); // Load the selected association data into the form fields.
    setShowForm(true); // Show the form for editing.
    setEditingAssoc(true); // Set the editing state to true.
    setEditingDocId(assoc.id); // Store the document ID being edited.
  };

  const handleDonationTypeInputChange = (e) => {
    const { name, value } = e.target;
    setDonationType((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save donation type to Firebase
  const handleSaveDonationType = async () => {
    const db = getFirestore();
    try {
      const sanitizedDonationType = {
        ...donationType,
        name: donationType.name.replace(/\s+/g, "").toLowerCase(),
        title: donationType.title
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      };
      await addDoc(collection(db, "donationTypes"), sanitizedDonationType);
      toast.success("Donation type added successfully!");
      setShowDonationTypeForm(false); // Hide form after adding
      setDonationType({ name: "", title: "" }); // Reset form fields
    } catch (error) {
      console.error("Error adding donation type:", error);
      toast.error("Failed to add donation type.");
    }
  };

  useEffect(() => {
    const fetchDonationTypes = async () => {
      const db = getFirestore(); // Connect to Firestore
      const donationTypesRef = collection(db, "donationTypes"); // Reference to the correct collection

      try {
        const querySnapshot = await getDocs(donationTypesRef); // Fetch the documents
        const typesArray = querySnapshot.docs.map((doc) => doc.data()); // Map the data to an array
        console.log("Donation Types fetched:", typesArray); // Check the fetched data in the console
        setDonationTypes(typesArray); // Update the state with the fetched types
      } catch (error) {
        console.error("Error fetching donation types:", error); // Handle errors if fetching fails
      }
    };

    fetchDonationTypes(); // Call the function to fetch data
  }, []);

  // Function to format and remove duplicates from donation requests
  const formatDonationRequests = (donationRequests) => {
    const uniqueRequests = new Set(
      donationRequests.map((request) =>
        request
          .replace(/([A-Z])/g, " $1") // Add a space before each capital letter
          .toLowerCase() // Normalize to lowercase
          .trim()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
          .join(" ")
      )
    );
    return Array.from(uniqueRequests).join(", "); // Join unique requests with commas
  };

  return (
    <div className="container">
      <ToastContainer /> {/* Container for displaying Toast notifications */}
      {selectedAssoc && (
        <div className="overlay" onClick={() => toggleOpen(selectedAssoc)}>
          <div
            className="org-details centered"
            onClick={(e) => e.stopPropagation()}
          >
            {isAdmin && editMode && (
              <div
                className="admin-buttons-wrapper"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteOrganization(selectedAssoc.id)}
                >
                  Delete Organization
                </button>
                <button
                  className="edit-btn"
                  onClick={() => handleEditButtonClick(selectedAssoc)}
                >
                  Edit Organization
                </button>
              </div>
            )}
            <h1>{selectedAssoc.nameAssociations}</h1>
            <p>Information: {selectedAssoc.information}</p>
            <p>
              Donation Requests:{" "}
              {formatDonationRequests(selectedAssoc.donationRequest)}
            </p>
            <p>District: {selectedAssoc.district}</p>
            <p>Address: {selectedAssoc.addressAssociations}</p>
            <p>Phone: {selectedAssoc.phoneAssociations}</p>
            <p>Riting: {selectedAssoc.riting}</p>
          </div>
        </div>
      )}
      {isAdmin && (
        <div className="admin-controls">
          <button
            className={`edit-mode-btn ${editMode ? "active" : ""}`}
            onClick={toggleEditMode}
          >
            <RxSwitch />
          </button>
          {editMode && (
            <>
              <button
                className="add-org-btn"
                onClick={() => {
                  setShowForm(true);
                  setEditingAssoc(false);
                  setNewAssoc({
                    IdAssociations: Date.now(),
                    addressAssociations: "",
                    district: "",
                    donationRequest: [],
                    information: "",
                    nameAssociations: "",
                    phoneAssociations: "",
                    riting: "",
                  });
                }}
              >
                Add New Organization
              </button>

              <button
                className="manage-donation-types-btn"
                onClick={() => {
                  setShowDonationTypeForm(true);
                }}
              >
                Manage Donation Types
              </button>
            </>
          )}
        </div>
      )}
      {showDonationTypeForm && (
        <div className="form-overlay">
          <div className="form-container">
            <h2>Add Donation Type</h2>
            <input
              type="text"
              name="name"
              value={donationType.name}
              onChange={handleDonationTypeInputChange}
              placeholder="Donation Type Name"
              required
            />
            <input
              type="text"
              name="title"
              value={donationType.title}
              onChange={handleDonationTypeInputChange}
              placeholder="Donation Type Title"
              required
            />
            <button onClick={handleSaveDonationType}>Save</button>
            <button onClick={() => setShowDonationTypeForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {showForm && (
        <div className="form-overlay">
          <div className="form-container">
            <form
              onSubmit={handleSubmit(
                editingAssoc ? handleEditOrganization : handleAddOrganization
              )}
            >
              <h2>
                {editingAssoc ? "Edit Organization" : "Add New Organization"}
              </h2>
              <input
                {...register("nameAssociations", {
                  required: true,
                  pattern: /^[a-zA-Z\s]*$/,
                })}
                type="text"
                name="nameAssociations"
                value={newAssoc.nameAssociations}
                onChange={handleInputChange}
                placeholder="Organization Name"
                required
              />
              {errors.nameAssociations && (
                <div className="error-message">
                  * Organization name must contain only letters and spaces.
                </div>
              )}

              <input
                {...register("addressAssociations", {
                  required: true,
                  pattern: /^[a-zA-Z0-9\s,.'-]{3,}$/,
                })}
                type="text"
                name="addressAssociations"
                value={newAssoc.addressAssociations}
                onChange={handleInputChange}
                placeholder="Address"
                required
              />
              {errors.addressAssociations && (
                <div className="error-message">
                  * Address must be at least 3 characters long and contain only
                  letters, numbers, and certain punctuation.
                </div>
              )}
              <input
                {...register("phoneAssociations", {
                  required: true,
                  pattern: /^[0-9]{10}$/,
                })}
                type="text"
                name="phoneAssociations"
                value={newAssoc.phoneAssociations}
                onChange={handleInputChange}
                placeholder="Phone"
                required
              />
              {errors.phoneAssociations && (
                <div className="error-message">
                  * Phone number must be exactly 10 digits.
                </div>
              )}

              <input
                {...register("riting", {
                  required: true,
                  pattern: /^(?:[1-9][0-9]?|100)$/,
                })}
                type="text"
                name="riting"
                value={newAssoc.riting}
                onChange={handleInputChange}
                placeholder="Riting"
                required
              />
              {errors.riting && (
                <div className="error-message">
                  * Rating must be a number between 0 and 100.
                </div>
              )}

              <select
                name="district"
                value={newAssoc.district}
                onChange={handleInputChange}
                required
              >
                <option value="">Select District</option>
                <option value="Center District">Center District</option>
                <option value="North District">North District</option>
                <option value="South District">South District</option>
                <option value="Jerusalem District">Jerusalem District</option>
                <option value="Eilat District">Eilat District</option>
              </select>

              <div className="checkbox-group">
                {donationTypes.length > 0 ? (
                  donationTypes.map((type) => (
                    <label key={type.name}>
                      <input
                        type="checkbox"
                        name={type.name}
                        checked={newAssoc.donationRequest.includes(type.name)}
                        onChange={handleCheckboxChange}
                      />
                      {type.title}
                    </label>
                  ))
                ) : (
                  <p>Loading donation types...</p>
                )}
                {newAssoc.donationRequest.length === 0 && (
                  <div className="error-message">
                    * At least one service must be selected.
                  </div>
                )}
              </div>

              <textarea
                name="information"
                value={newAssoc.information}
                onChange={handleInputChange}
                placeholder="Information"
                required
              />

              <button type="submit">
                {editingAssoc ? "Update Organization" : "Add Organization"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
      <div className={`org-list ${showForm ? "blurred" : ""}`}>
        {associations.length > 0 ? (
          associations.map(
            (assoc) =>
              assoc &&
              assoc.donationRequest && ( // בדיקה אם assoc וה-donationRequest לא ריקים
                <div
                  key={assoc.id}
                  className="org-entry"
                  onClick={() => toggleOpen(assoc)}
                >
                  <h1>{assoc.nameAssociations}</h1>
                  <p>District: {assoc.district}</p>
                  <p>
                    Donation Requests:{" "}
                    {formatDonationRequests(assoc.donationRequest)}
                  </p>
                </div>
              )
          )
        ) : (
          <p>No associations available.</p>
        )}
      </div>
    </div>
  );
}

export default SearchDonations;
