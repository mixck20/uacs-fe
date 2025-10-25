import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { PatientsAPI, InventoryAPI, AppointmentsAPI, AuthAPI } from "./api";
import "./App.css";
import Login from "./components/Login";
import Signup from "./components/Signup";
import SignupSuccess from "./components/SignupSuccess";
import VerifyEmail from "./components/VerifyEmail";
import ClinicDashboard from "./components/ClinicDashboard";
import UserDashboard from "./components/UserDashboard";
import UserAppointment from "./components/UserAppointment";
import UserHealthRecord from "./components/UserHealthRecord";
import UserFeedback from "./components/UserFeedback";
import Patients from "./components/Patients";
import Inventory from "./components/Inventory";
import Appointment from "./components/Appointment";
import Email from "./components/Email";
import EHR from "./components/EHR";


function App() {
  const [authPage, setAuthPage] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [patients, setPatients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const handleLoginSuccess = (role) => {
    console.log('Login successful, role:', role);
    
    // Get the stored user data
    const userStr = localStorage.getItem('user');
    let user = null;
    
    try {
      user = JSON.parse(userStr);
      console.log('Parsed user data:', user);
      
      if (!user || !user._id) {
        throw new Error('Invalid user data');
      }
      
      setUserData(user);
      setIsLoggedIn(true);
      setUserRole(role);
      localStorage.setItem('userRole', role);
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      handleLogout();
      return;
    }
    
    // Make sure we have a valid token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.error('No token found after login');
      handleLogout();
      return;
    }
    
    console.log('Token and role set successfully');
  };

  const handleLogout = async () => {
    try {
      await AuthAPI.logout();
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      
      setIsLoggedIn(false);
      setUserRole(null);
      setAuthPage("login");
      setActivePage("dashboard");
      setPatients([]);
      setInventory([]);
      setAppointments([]);
      
      // Force page refresh to clear any remaining state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear everything even if the API call fails
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const handlePageChange = (newPage) => {
    console.log('Changing page to:', newPage);
    setActivePage(newPage);
  };

  // Persist auth across refresh
  useEffect(() => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const savedRole = localStorage.getItem("userRole");
      const userStr = localStorage.getItem("user");
      
      if (token && savedRole && userStr) {
        const user = JSON.parse(userStr);
        if (user && user._id) {
          console.log('Restored session:', { savedRole, user });
          setIsLoggedIn(true);
          setUserRole(savedRole);
          setUserData(user);
        } else {
          throw new Error('Invalid user data in storage');
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      handleLogout();
    }
  }, []);

  // Load data when user is logged in
  useEffect(() => {
    if (isLoggedIn && ['admin', 'clinic'].includes(userRole)) {
      const loadData = async () => {
        try {
          const [patientsData, inventoryData, appointmentsData] = await Promise.all([
            PatientsAPI.list(),
            InventoryAPI.list(),
            AppointmentsAPI.list()
          ]);
          setPatients(patientsData);
          setInventory(inventoryData);
          setAppointments(appointmentsData);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      };
      loadData();
    }
  }, [isLoggedIn, userRole]);

  const commonProps = {
    setActivePage: (page) => {
      console.log('Setting active page to:', page); // Debug log
      setActivePage(page);
    },
    activePage,
    sidebarOpen,
    setSidebarOpen,
    onLogout: handleLogout,
    userRole
  };

  const getActiveComponent = () => {
    if (['student', 'faculty'].includes(userRole)) {
      return (
        <UserDashboard
          {...commonProps}
          appointments={appointments}
          setAppointments={setAppointments}
          user={{
            fullName: localStorage.getItem('user') || 'User',
            role: userRole
          }}
        />
      );
    }

    if (['admin', 'clinic', 'clinic_staff'].includes(userRole)) {
      console.log('Rendering page:', activePage);
      switch(activePage) {
        case 'patients':
          return (
            <Patients
              {...commonProps}
              patients={patients}
              setPatients={setPatients}
            />
          );
        case 'ehr':
          return (
            <EHR
              {...commonProps}
              patients={patients}
              setPatients={setPatients}
            />
          );
        case 'inventory':
          return (
            <Inventory
              {...commonProps}
              inventory={inventory}
              setInventory={setInventory}
            />
          );
        case 'appointment':
          return (
            <Appointment
              {...commonProps}
              patients={patients}
              appointments={appointments}
              setAppointments={setAppointments}
            />
          );
        case 'email':
          return (
            <Email
              {...commonProps}
              patients={patients}
              appointments={appointments}
              inventory={inventory}
            />
          );
        case 'dashboard':
        default:
          return (
            <ClinicDashboard
              {...commonProps}
              patients={patients}
              inventory={inventory}
              appointments={appointments}
            />
          );
      }
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? 
            <Navigate to="/" /> : 
            <Login onLogin={handleLoginSuccess} />
        } />
        <Route path="/signup" element={
          isLoggedIn ? 
            <Navigate to="/" /> : 
            <Signup />
        } />
        <Route path="/signup-success" element={
          isLoggedIn ? 
            <Navigate to="/" /> : 
            <SignupSuccess />
        } />
        <Route path="/verify/:token" element={<SignupSuccess />} />
        <Route path="/*" element={
          !isLoggedIn ? 
            <Navigate to="/login" /> :
            ['student', 'faculty'].includes(userRole) ? (
              <div className="app-container">
                <Routes>
                  <Route path="/dashboard" element={
                    <UserDashboard 
                      user={userData}
                      appointments={appointments} 
                      onLogout={handleLogout} 
                    />
                  } />
                  <Route path="/appointments" element={
                    <UserAppointment 
                      user={userData}
                      appointments={appointments} 
                      onLogout={handleLogout}
                    />
                  } />
                  <Route path="/records" element={
                    <UserHealthRecord 
                      user={userData}
                      onLogout={handleLogout}
                    />
                  } />
                  <Route path="/feedback" element={
                    <UserFeedback
                      user={userData}
                      onLogout={handleLogout}
                    />
                  } />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            ) : (
              <div className="app-container">
                {getActiveComponent()}
              </div>
            )
        } />
      </Routes>
    </Router>
  );
}

export default App;