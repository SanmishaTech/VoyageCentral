import { useEffect } from "react";
import { appName } from "./config"; // Import appName from config
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";

import Login from "./modules/Auth/Login";
import Register from "./modules/Auth/Register";
import ForgotPassword from "./modules/Auth/ForgotPassword";
import ResetPassword from "./modules/Auth/ResetPassword";

import ProtectedRoute from "./components/common/protected-route"; // Correct path

import Dashboard from "./modules/Dashboard/DashboardPage";

import ProfilePage from "./modules/Profile/ProfilePage";

import UserList from "@/modules/User/UserList";

import AgencyList from "@/modules/Agency/AgencyList";
import CreateAgency from "@/modules/Agency/CreateAgency";
import EditAgency from "@/modules/Agency/EditAgency";

import { Toaster } from "sonner";
import "./App.css";
import PackageList from "./modules/Package/PackageList";
import Countries from "./modules/Country/CountryList";

const App = () => {
  useEffect(() => {
    document.title = appName; // Set the document title
  }, []);

  return (
    <>
      <Toaster richColors position="top-center" />
      <Router>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            {/* Add other auth routes here */}
          </Route>
          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <UserList />
                </ProtectedRoute>
              }
            />

            {/* Add other main routes here */}

            <Route
              path="/packages"
              element={
                <ProtectedRoute>
                  <PackageList />
                </ProtectedRoute>
              }
            />

            {/* Removed the /packages/edit/:id route as we're using dialog now */}
            <Route
              path="/agencies"
              element={
                <ProtectedRoute>
                  <AgencyList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/agencies/create"
              element={
                <ProtectedRoute>
                  <CreateAgency />
                </ProtectedRoute>
              }
            />

            <Route
              path="/agencies/:id/edit"
              element={
                <ProtectedRoute>
                  <EditAgency />
                </ProtectedRoute>
              }
            />

            <Route
              path="/countries"
              element={
                <ProtectedRoute>
                  <Countries />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
