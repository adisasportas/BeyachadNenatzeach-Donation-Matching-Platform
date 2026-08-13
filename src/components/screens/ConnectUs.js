import React, { useEffect, useState, useCallback } from "react";
import "../screensCSS/ConnectUs.css";
import { firebase } from "../../services/firebase/FireStore";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../../services/contexts/AuthContext";

const ConnectUs = () => {
  // State variables to manage form data and component behavior.
  const [fullName, setFullName] = useState(""); // State to store the user's full name.
  const [email, setEmail] = useState(""); // State to store the user's email address.
  const [subject, setSubject] = useState(""); // State to store the subject of the inquiry.
  const [message, setMessage] = useState(""); // State to store the message content of the inquiry.
  const [inquiries, setInquiries] = useState([]); // State to store all inquiries fetched from Firestore.
  const [filteredInquiries, setFilteredInquiries] = useState([]); // State to store inquiries filtered by status.
  const [selectedInquiry, setSelectedInquiry] = useState(null); // State to track the currently selected inquiry for viewing.
  const [isAdmin, setIsAdmin] = useState(false); // State to track if the current user is an admin.
  const { currentUser } = useAuth(); // Accessing the current authenticated user from the AuthContext.
  const [localCurrentUser, setLocalCurrentUser] = useState(null); // State to store the user data loaded from localStorage.
  const [loading, setLoading] = useState(true); // State to track the loading state while fetching data.
  const [filter, setFilter] = useState("all"); // State to store the current filter applied to inquiries (all, open, closed).
  const [errors, setErrors] = useState({}); // State to store validation errors for the form fields.

  // useEffect to load the user from localStorage when the component mounts.
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser")); // Retrieve the currentUser from localStorage.
    if (storedUser) {
      setLocalCurrentUser(storedUser); // Set the loaded user to the localCurrentUser state.
      console.log("User loaded from localStorage:", storedUser); // Log the loaded user for debugging.
    } else {
      console.log("No user found in localStorage."); // Log if no user is found in localStorage.
    }
    setLoading(false); // Set loading to false once the user is loaded.
  }, []); // Empty dependency array to run this effect only once on component mount.

  // useEffect to check if the current user is an admin.
  useEffect(() => {
    if (loading) return; // If loading is true, return early.

    const checkAdmin = async () => {
      const user = currentUser || localCurrentUser; // Use the currentUser or fallback to localCurrentUser.
      if (!user || !user.uid) {
        console.log("No valid user found. User is:", user); // Log if no valid user is found.
        return;
      }

      console.log("Checking admin status for user:", user.uid); // Log the user ID being checked.

      const db = firebase; // Initialize Firestore database instance.
      const usersRef = collection(db, "users"); // Reference the "users" collection in Firestore.
      const q = query(
        usersRef,
        where("userName", "==", "admin"), // Add condition to query for users with userName "admin".
        where("fullName", "==", "admin") // Add condition to query for users with fullName "admin".
      );

      try {
        const querySnapshot = await getDocs(q); // Execute the query to get matching documents.
        if (!querySnapshot.empty) {
          const adminDoc = querySnapshot.docs[0]; // Get the first document from the query results.
          if (adminDoc.id === user.uid) {
            console.log("User is an admin."); // Log if the user is an admin.
            setIsAdmin(true); // Set isAdmin to true if the user is an admin.
          } else {
            console.log("User is not an admin."); // Log if the user is not an admin.
          }
        } else {
          console.log("No admin user found in database."); // Log if no admin user is found.
        }
      } catch (error) {
        console.error("Error checking admin status:", error); // Log any errors that occur during the admin check.
      }
    };

    checkAdmin(); // Call the function to check admin status.
  }, [currentUser, localCurrentUser, loading]); // Dependencies array to run this effect when currentUser, localCurrentUser, or loading changes.

  // useEffect to fetch inquiries if the user is an admin.
  useEffect(() => {
    if (!isAdmin) return; // Return early if the user is not an admin.

    const fetchInquiries = async () => {
      const db = firebase; // Initialize Firestore database instance.
      const inquiriesCollection = collection(db, "inquiries"); // Reference the "inquiries" collection in Firestore.
      const q = query(
        inquiriesCollection,
        where("adminId", "==", currentUser?.uid || localCurrentUser?.uid) // Add condition to query inquiries assigned to the current admin.
      );
      const querySnapshot = await getDocs(q); // Execute the query to get matching documents.
      const inquiriesList = querySnapshot.docs.map((doc) => ({
        id: doc.id, // Set the document ID.
        ...doc.data(), // Spread the document data.
      }));
      setInquiries(inquiriesList); // Set the inquiries state with the fetched inquiries.
    };

    fetchInquiries(); // Call the function to fetch inquiries.
  }, [currentUser, localCurrentUser, isAdmin]); // Dependencies array to run this effect when currentUser, localCurrentUser, or isAdmin changes.

  // useEffect to filter inquiries based on the current filter state.
  useEffect(() => {
    if (filter === "open") {
      setFilteredInquiries(
        inquiries.filter((inquiry) => inquiry.status === "open") // Filter inquiries for those with status "open".
      );
    } else if (filter === "closed") {
      setFilteredInquiries(
        inquiries.filter((inquiry) => inquiry.status === "closed") // Filter inquiries for those with status "closed".
      );
    } else {
      setFilteredInquiries(inquiries); // Set filteredInquiries to all inquiries if the filter is "all".
    }
  }, [filter, inquiries]); // Dependencies array to run this effect when filter or inquiries change.

  // Function to handle changing the filter state.
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter); // Update the filter state with the new filter.
  };

  // useCallback to memoize the handleInputChange function and avoid unnecessary re-renders.
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target; // Destructure the name and value from the event target.
    if (name === "fullName") setFullName(value); // Update fullName state if the name matches.
    if (name === "email") setEmail(value); // Update email state if the name matches.
    if (name === "subject") setSubject(value); // Update subject state if the name matches.
    if (name === "message") setMessage(value); // Update message state if the name matches.
  }, []); // Empty dependency array to ensure this function is only created once.

  // Function to handle form submission for sending an inquiry.
  const handleFormSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior.
    if (!validate()) {
      return; // Stop if validation fails
    }
    try {
      const user = currentUser || localCurrentUser; // Use the currentUser or fallback to localCurrentUser.
      if (!user || !user.uid) {
        throw new Error("User not authenticated. Cannot submit inquiry."); // Throw an error if the user is not authenticated.
      }

      const db = firebase; // Initialize Firestore database instance.
      const inquiriesCollection = collection(db, "inquiries"); // Reference the "inquiries" collection in Firestore.
      const adminUser = "CzdRCmUwf4PH3SZAtf4mFEGx7ON2"; // Admin user's DocID (replace with the actual admin DocID).

      await addDoc(inquiriesCollection, {
        inquiriesId: Date.now(), // Generate a unique ID for the inquiry.
        userId: user.uid, // Set the user ID.
        adminId: adminUser, // Set the admin ID.
        fullName: fullName, // Set the full name.
        email: email, // Set the email address.
        subject: subject, // Set the subject of the inquiry.
        message: message, // Set the message content.
        status: "open", // Set the initial status to "open".
      });

      alert("Message sent successfully!"); // Show a success alert to the user.
      setFullName(""); // Clear the fullName state.
      setEmail(""); // Clear the email state.
      setSubject(""); // Clear the subject state.
      setMessage(""); // Clear the message state.
    } catch (error) {
      console.error("Error sending message: ", error); // Log any errors that occur during inquiry submission.
      alert("Failed to send message. Please try again."); // Show an error alert to the user.
    }
  };

  // Function to toggle the modal for viewing an inquiry's details.
  const toggleModal = (inquiry) => {
    setSelectedInquiry(selectedInquiry ? null : inquiry); // Toggle between showing and hiding the modal.
  };

  // Function to handle updating the status of an inquiry.
  const handleUpdateStatus = async (inquiryId, newStatus) => {
    const db = firebase; // Initialize Firestore database instance.
    const inquiryDoc = doc(db, "inquiries", inquiryId); // Reference the specific inquiry document.
    await updateDoc(inquiryDoc, { status: newStatus }); // Update the status of the inquiry document.
    setInquiries((prevInquiries) =>
      prevInquiries.map(
        (inq) => (inq.id === inquiryId ? { ...inq, status: newStatus } : inq) // Update the status in the inquiries state.
      )
    );
  };

  // Conditional rendering to show a loading message while data is being fetched.
  if (loading) {
    return <div>Loading...</div>;
  }

  // Conditional rendering to show a message if no inquiries are found for admins.
  if (isAdmin && filteredInquiries.length === 0) {
    return <div>No inquiries found.</div>;
  }

  // Conditional rendering to show a message if no inquiries are found for admins.
  const validate = () => {
    const newErrors = {}; // Initialize an object to store validation errors.

    // Validate full name
    const nameParts = fullName.trim().split(" "); // Split the full name into parts.
    if (nameParts.length < 2 || nameParts.some((part) => part.length < 2)) {
      newErrors.fullName =
        "Full name must contain at least two words with at least two letters each."; // Add an error if the full name is invalid.
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regular expression to validate email format.
    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address."; // Add an error if the email is invalid.
    }

    // Validate subject and message
    const wordRegex = /\b\w{2,}\b/; // Regular expression to match words with at least two letters.
    if (!wordRegex.test(subject)) {
      newErrors.subject =
        "Subject must contain at least one word with at least two letters."; // Add an error if the subject is invalid.
    }
    if (!wordRegex.test(message)) {
      newErrors.message =
        "Message must contain at least one word with at least two letters."; // Add an error if the message is invalid.
    }

    setErrors(newErrors); // Update the errors state with the validation errors.
    return Object.keys(newErrors).length === 0; // Return true if there are no validation errors.
  };

  return (
    <div className="connectUs">
      {isAdmin ? (
        <>
          <h1>User Inquiries</h1>
          <div className="filter-buttons">
            <button onClick={() => handleFilterChange("all")}>
              All Inquiries
            </button>
            <button onClick={() => handleFilterChange("open")}>
              Open Inquiries
            </button>
            <button onClick={() => handleFilterChange("closed")}>
              Closed Inquiries
            </button>
          </div>
          <div className="inquiries-container">
            <div className="inquiries-list-wrapper">
              <ul className="inquiries-list">
                {filteredInquiries.map((inquiry) => (
                  <li
                    key={inquiry.id}
                    className={`inquiry-item ${
                      inquiry.status === "open" ? "open" : "closed"
                    }`}
                    onClick={() => toggleModal(inquiry)}
                  >
                    <h3>{inquiry.subject}</h3>
                    <p>
                      {inquiry.message.length > 50
                        ? `${inquiry.message.slice(0, 50)}...`
                        : inquiry.message}
                    </p>
                    <button
                      className="btn btn-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModal(inquiry);
                      }}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-status"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(
                          inquiry.id,
                          inquiry.status === "open" ? "closed" : "open"
                        );
                      }}
                    >
                      {inquiry.status === "open" ? "Mark as Closed" : "Reopen"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {selectedInquiry && (
              <div className="modal-overlay" onClick={() => toggleModal(null)}>
                <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2>{selectedInquiry.subject}</h2>
                  <p>
                    <strong>Full Name:</strong> {selectedInquiry.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedInquiry.email}
                  </p>
                  <p>{selectedInquiry.message}</p>
                  <p>
                    <strong>Status:</strong> {selectedInquiry.status}
                  </p>
                  <button
                    className="btn btn-close"
                    onClick={() => toggleModal(null)}
                  ></button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <h1>Contact Us</h1>
          <div className="contact-container">
            <form onSubmit={handleFormSubmit} className="contact-form">
              <div className="left-column">
                <label>
                  Full Name:
                  <input
                    type="text"
                    name="fullName"
                    value={fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                  />
                  {errors.fullName && (
                    <p className="error">{errors.fullName}</p>
                  )}
                </label>
                <label>
                  Email Address:
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
                  />
                  {errors.email && <p className="error">{errors.email}</p>}
                </label>
              </div>
              <div className="right-column">
                <label>
                  Subject:
                  <input
                    type="text"
                    name="subject"
                    value={subject}
                    onChange={handleInputChange}
                    placeholder="Inquiry about donations"
                  />
                  {errors.subject && <p className="error">{errors.subject}</p>}
                </label>
                <label>
                  Message:
                  <textarea
                    name="message"
                    value={message}
                    onChange={handleInputChange}
                    placeholder="Please enter your message here"
                  />
                  {errors.message && <p className="error">{errors.message}</p>}
                </label>
                <button type="submit">Send</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectUs; // Export the ConnectUs component as the default export
