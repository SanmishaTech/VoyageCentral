import React from "react";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user || !user.role) return null; // or a fallback/redirect

  if (user.role === "admin") {
    return <AdminDashboard />;
  } else if (user.role === "super_admin") {
    return <SuperAdminDashboard />;
  } else {
    return <UserDashboard />;
  }
  // Add more roles as needed
};

export default Dashboard;
