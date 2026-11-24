import React, { useEffect, useState } from "react";
import { firebase } from "../../services/firebase/FireStore";
import {
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  query,
  collection,
  where,
  addDoc,
} from "firebase/firestore";
import "../screensCSS/Messages.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../services/contexts/AuthContext";
import { isAdmin as isAdminUser } from "../../services/admin";

const fetchMessages = async (user, setMessages, setUnreadCount) => {
  // Function to fetch messages for the current user.
  if (!user || !user.uid) {
    console.log("No currentUser or localCurrentUser.uid, returning"); // Log if no user is found.
    return;
  }

  console.log("Fetching messages for user:", user); // Log the user for debugging.

  // Create a Firestore query to get messages where the receiverId matches the user's UID.
  const q = query(
    collection(firebase, "messages"),
    where("receiverId", "==", user.uid)
  );

  // Listen for real-time updates on the user's messages.
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const userMessages = snapshot.docs.map((doc) => ({
      id: doc.id, // Include the document ID.
      ...doc.data(), // Spread the document data.
    }));
    console.log("Fetched messages from Firestore:", userMessages); // Log the fetched messages.
    setMessages(userMessages); // Update the messages state with the fetched messages.
    setUnreadCount(userMessages.filter((message) => !message.read).length); // Update the unread count.

    // Update local storage with the latest messages.
    localStorage.setItem("messages", JSON.stringify(userMessages));
  });

  // Return the unsubscribe function to be used for cleanup
  return unsubscribe;
};

const Messages = () => {
  // State variables to manage the component's data and behavior.
  const [messages, setMessages] = useState([]); // State to store the list of messages.
  const [unreadCount, setUnreadCount] = useState(0); // State to track the number of unread messages.
  const [selectedMessage, setSelectedMessage] = useState(null); // State to store the currently selected message for viewing.
  const [showSendMessageForm, setShowSendMessageForm] = useState(false); // State to toggle the visibility of the send message form.
  const [users, setUsers] = useState([]); // State to store the list of users.
  const [newMessage, setNewMessage] = useState({
    to: "", // Recipient ID.
    subject: "", // Message subject.
    message: "", // Message content.
  });
  const [isAdmin, setIsAdmin] = useState(false); // State to track if the current user is an admin.
  const { currentUser } = useAuth(); // Accessing the current authenticated user from the AuthContext.
  const [localCurrentUser, setLocalCurrentUser] = useState(null); // State to store the user data loaded from localStorage.

  // useEffect to load the user from localStorage when the component mounts.
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser")); // Retrieve the currentUser from localStorage.
    if (storedUser) {
      setLocalCurrentUser(storedUser); // Set the loaded user to the localCurrentUser state.
    }
  }, []); // Empty dependency array to run this effect only once on component mount.

  // useEffect to check if the current user is an admin.
  useEffect(() => {
    setIsAdmin(isAdminUser(currentUser || localCurrentUser));
  }, [currentUser, localCurrentUser]); // Dependencies array to run this effect when currentUser or localCurrentUser changes.

  // useEffect to fetch messages for the current user.
  useEffect(() => {
    const user = currentUser || localCurrentUser; // Use the currentUser or fallback to localCurrentUser.
    if (user && user.uid) {
      fetchMessages(user, setMessages, setUnreadCount); // Fetch messages if the user has a UID.
    } else if (user && user.id) {
      // If UID is missing, use ID as a fallback.
      fetchMessages({ ...user, uid: user.id }, setMessages, setUnreadCount);
    }
  }, [currentUser, localCurrentUser]); // Dependencies array to run this effect when currentUser or localCurrentUser changes.

  // useEffect to fetch all users from Firestore.
  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(firebase, "users")); // Execute the query to get all users.
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id, // Include the document ID.
        ...doc.data(), // Spread the document data.
      }));
      setUsers(usersList); // Update the users state with the fetched users.
    };

    if (currentUser || localCurrentUser) {
      fetchUsers(); // Fetch users if the current user is available.
    }
  }, [currentUser, localCurrentUser]); // Dependencies array to run this effect when currentUser or localCurrentUser changes.

  // Function to mark a message as read.
  const markAsRead = async (messageId) => {
    console.log("markAsRead called with ID:", messageId); // Log the message ID for debugging.
    try {
      const messagesCollection = collection(firebase, "messages"); // Reference the "messages" collection in Firestore.
      const q = query(messagesCollection, where("id", "==", messageId)); // Query for the specific message by ID.
      const querySnapshot = await getDocs(q); // Execute the query to get the message document.

      if (!querySnapshot.empty) {
        const messageDoc = querySnapshot.docs[0]; // Get the first document from the query results.
        await updateDoc(doc(firebase, "messages", messageDoc.id), {
          read: true, // Update the read status to true.
        });

        // Update the messages state to mark the message as read.
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, read: true } : msg
          )
        );

        // Update the unread count after marking the message as read.
        setUnreadCount(
          messages.filter(
            (message) => !message.read && message.id !== messageId
          ).length
        );
      } else {
        console.error("No matching document found for ID:", messageId); // Log if no matching document is found.
      }
    } catch (error) {
      console.error("Error marking message as read:", error); // Log any errors that occur during the update.
    }
  };

  // Function to mark a message as unread.
  const markAsUnread = async (messageId) => {
    console.log("markAsUnread called with ID:", messageId); // Log the message ID for debugging.
    try {
      // מציאת ההודעה המתאימה עם ה-ID
      const messagesCollection = collection(firebase, "messages"); // Reference the "messages" collection in Firestore.
      const q = query(messagesCollection, where("id", "==", messageId)); // Query for the specific message by ID.
      const querySnapshot = await getDocs(q); // Execute the query to get the message document.

      if (!querySnapshot.empty) {
        const messageDoc = querySnapshot.docs[0]; // Get the first document from the query results.
        await updateDoc(doc(firebase, "messages", messageDoc.id), {
          read: false, // Update the read status to false.
        });

        // Update the messages state to mark the message as unread.
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, read: false } : msg
          )
        );

        // Update the unread count after marking the message as unread.
        setUnreadCount(
          messages.filter(
            (message) => !message.read || message.id === messageId
          ).length
        );
      } else {
        console.error("No matching document found for ID:", messageId); // Log if no matching document is found.
      }
    } catch (error) {
      console.error("Error marking message as unread:", error); // Log any errors that occur during the update.
    }
  };

  // Function to toggle the visibility of the message modal.
  const toggleModal = (message) => {
    console.log("toggleModal called with message:", message); // Log the message for debugging.
    if (message && !message.read) {
      markAsRead(message.id); // Mark the message as read when it is opened.
    }
    setSelectedMessage(selectedMessage ? null : message); // Toggle the selected message.
  };

  // Function to handle input changes for the send message form.
  const handleInputChange = (e) => {
    const { name, value } = e.target; // Destructure the name and value from the event target.
    setNewMessage((prev) => ({
      ...prev,
      [name]: value, // Update the newMessage state with the input value.
    }));
  };

  // Function to handle sending a new message.
  const handleSendMessage = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior.
    const receiver = users.find((u) => u.id === newMessage.to); // Find the receiver by ID.
    if (!receiver) {
      toast.error("User not found!"); // Show an error if the receiver is not found.
      return;
    }
    const user = currentUser || localCurrentUser; // Use the currentUser or fallback to localCurrentUser.

    if (!user || !user.uid) {
      toast.error("Current user not authenticated!"); // Show an error if the user is not authenticated.
      return;
    }
    try {
      await addDoc(collection(firebase, "messages"), {
        subject: newMessage.subject, // Set the message subject.
        message: newMessage.message, // Set the message content.
        receiverId: newMessage.to, // Set the receiver's ID.
        senderId: user.uid, // Set the sender's ID.
        read: false, // Mark the message as unread.
        id: Date.now(), // Generate a unique ID for the message.
      });
      toast.success("Message sent successfully!"); // Show a success toast notification.
      setShowSendMessageForm(false); // Hide the send message form.
      setNewMessage({
        to: "", // Reset the recipient ID.
        subject: "", // Reset the subject.
        message: "", // Reset the message content.
      });
      fetchMessages(user, setMessages, setUnreadCount); // Reload messages after sending a new one.
    } catch (error) {
      console.error("Error sending message:", error); // Log any errors that occur during message sending.
      toast.error("Failed to send message."); // Show an error toast notification.
    }
  };

  return (
    <div className="messages-container">
      <ToastContainer /> {/* Container for Toast notifications */}
      <div className="messages-header">
        <h1>Messages</h1> {/* Header title */}
        {unreadCount > 0 && (
          <div className="unread-count">
            <span>{unreadCount}</span> {/* Display unread message count */}
          </div>
        )}
        {isAdmin && (
          <button
            className="btn btn-send-message"
            onClick={() => setShowSendMessageForm(true)}
          >
            Send Message
          </button>
        )}
      </div>
      <div className="messages-list-wrapper">
        <ul className="messages-list">
          {/* Sort messages to display unread messages first */}
          {messages
            .sort((a, b) => a.read - b.read) // Unread messages (false) appear before read ones (true)
            .map((message) => (
              <li
                key={message.id}
                className={`message-item ${message.read ? "read" : "unread"}`}
                onClick={() => toggleModal(message)}
              >
                <h3>{message.subject}</h3> {/* Message subject */}
                <p>
                  {message.message.length > 50
                    ? `${message.message.slice(0, 50)}...`
                    : message.message}
                </p>{" "}
                {/* Display the first 50 characters of the message */}
                <button
                  className="btn btn-unread"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the modal
                    markAsUnread(message.id);
                  }}
                >
                  Mark as Unread
                </button>{" "}
                {/* Button to mark the message as unread */}
                <button
                  className="btn btn-view"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the modal
                    toggleModal(message);
                  }}
                >
                  View
                </button>{" "}
                {/* Button to view the full message */}
              </li>
            ))}
        </ul>
      </div>
      {selectedMessage && (
        <div className="modal-overlay" onClick={() => toggleModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedMessage.subject}</h2>{" "}
            {/* Modal title displaying the message subject */}
            <p>{selectedMessage.message}</p>{" "}
            {/* Modal content displaying the full message */}
            <button
              className="btn btn-close"
              onClick={() => toggleModal(null)}
            ></button>{" "}
            {/* Button to close the modal */}
          </div>
        </div>
      )}
      {showSendMessageForm && (
        <div
          className="form-overlay"
          onClick={() => setShowSendMessageForm(false)}
        >
          <div className="form-container" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSendMessage}>
              <h2>Send Message</h2> {/* Form title */}
              <label htmlFor="to">To:</label>
              <select
                name="to"
                value={newMessage.to}
                onChange={handleInputChange}
                required
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.userName}
                  </option>
                ))}
              </select>
              <label htmlFor="subject">Subject:</label>
              <input
                type="text"
                name="subject"
                value={newMessage.subject}
                onChange={handleInputChange}
                required
              />{" "}
              {/* Input field for the message subject */}
              <label htmlFor="message">Message:</label>
              <textarea
                name="message"
                value={newMessage.message}
                onChange={handleInputChange}
                required
              ></textarea>{" "}
              {/* Textarea for the message content */}
              <button type="submit">Send</button>{" "}
              {/* Button to send the message */}
              <button
                type="button"
                onClick={() => setShowSendMessageForm(false)}
              >
                Cancel
              </button>{" "}
              {/* Button to cancel sending the message */}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export { Messages as default, fetchMessages }; // Export the Messages component as default and fetchMessages as a named export
