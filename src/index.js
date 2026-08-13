import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./components/screens/HomePage";
import AboutMe from "./components/screens/AboutMe";
import AddDonation from "./components/screens/AddDonation";
import ConnectUs from "./components/screens/ConnectUs";
import SearchDonations from "./components/screens/SearchDonations";
import LogIn from "./components/screens/LogIn";
import Registertion from "./components/screens/Registertion";
import NotFound from "./components/screens/NotFound";
import Footer from "./components/footer/Footer";
import Navbar from "./components/navbar/Navbar";
import Settings from "./components/screens/Settings";
import Messages from "./components/screens/Messages";
import { AuthProvider } from "../src/services/contexts/AuthContext";
import ProtectedUserRoute from "../src/services/protectedRoute/ProtectedUserRoute";
import { UserProvider } from "./services/contexts/UserContext";

ReactDOM.render(
  // Wrapping the entire app with AuthProvider for authentication state management
  <AuthProvider>
    <UserProvider>
      {" "}
      {/* Wrapping the entire app with UserProvider to manage user-related data */}
      <BrowserRouter>
        {" "}
        {/* Wrapping the app in BrowserRouter to handle routing */}
        <Navbar />{" "}
        {/* Navbar is placed outside Routes so it appears on every page */}
        <Routes>
          {" "}
          {/* Defining all the routes for the application */}
          <Route path="/" element={<HomePage />} />
          <Route path="/Log_In" element={<LogIn />} />
          <Route path="/Registertion" element={<Registertion />} />
          {/* Protected route for the AboutMe page */}
          <Route
            path="/About_Me"
            element={
              <ProtectedUserRoute>
                <AboutMe />
              </ProtectedUserRoute>
            }
          />
          {/* Protected route for the AddDonation page */}
          <Route
            path="/Add_Donation"
            element={
              <ProtectedUserRoute>
                <AddDonation />
              </ProtectedUserRoute>
            }
          />
          {/* Protected route for the ConnectUs page */}
          <Route
            path="/Connect_Us"
            element={
              <ProtectedUserRoute>
                <ConnectUs />
              </ProtectedUserRoute>
            }
          />
          {/* Protected route for the SearchDonations page */}
          <Route
            path="/Donations_Search"
            element={
              <ProtectedUserRoute>
                <SearchDonations />
              </ProtectedUserRoute>
            }
          />
          {/* Protected route for the Settings page */}
          <Route
            path="/Settings"
            element={
              <ProtectedUserRoute>
                <Settings />
              </ProtectedUserRoute>
            }
          />
          {/* Protected route for the Messages page */}
          <Route
            path="/Messages"
            element={
              <ProtectedUserRoute>
                <Messages />
              </ProtectedUserRoute>
            }
          />
          {/* Catch-all route for undefined paths to display NotFound page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* Footer is placed outside Routes so it appears on every page */}
        <Footer />
      </BrowserRouter>
    </UserProvider>
  </AuthProvider>,
  document.getElementById("root") // Render the app into the root DOM element
);
