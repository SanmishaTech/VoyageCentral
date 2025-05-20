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
import AgencyProfile from "@/modules/Agency/AgencyProfile";
import HotelList from "@/modules/Hotel/HotelList";
import CreateHotel from "@/modules/Hotel/CreateHotel";
import EditHotel from "@/modules/Hotel/EditHotel";

import AgentList from "@/modules/Agent/AgentList";
import CreateAgent from "@/modules/Agent/CreateAgent";
import EditAgent from "@/modules/Agent/EditAgent";

import ClientList from "@/modules/Client/ClientList";
import CreateClient from "@/modules/Client/CreateClient";
import EditClient from "@/modules/Client/EditClient";

import BookingList from "@/modules/Booking/BookingList";
import CreateBooking from "@/modules/Booking/CreateBooking";
import EditBooking from "@/modules/Booking/EditBooking";
import AddFollowUp from "@/modules/Booking/AddFollowUp";
import BookingDetails from "@/modules/Booking/BookingDetails";
import CreateJourneyBooking from "@/modules/Booking/JourneyBooking/CreateJourneyBooking";
import UpdateJourneyBooking from "@/modules/Booking/JourneyBooking/EditJourneyBooking";
import CreateHotelBooking from "@/modules/Booking/HotelBooking/CreateHotelBooking";
import UpdateHotelBooking from "@/modules/Booking/HotelBooking/EditHotelBooking";
import CreateServiceBooking from "@/modules/Booking/ServiceBooking/CreateServiceBooking";
import UpdateServiceBooking from "@/modules/Booking/ServiceBooking/EditServiceBooking";
import CreateVehicleBooking from "@/modules/Booking/VehicleBooking/CreateVehicleBooking";
import UpdateVehicleBooking from "@/modules/Booking/VehicleBooking/EditVehicleBooking";
import CreateTravelDocument from "@/modules/Booking/TravelDocument/CreateTravelDocument";
import UpdateTravelDocument from "@/modules/Booking/TravelDocument/EditTravelDocument";
import CreateTourMember from "@/modules/Booking/TourMembers/CreateTourMember";
import CreateBookingReceipt from "@/modules/Booking/BookingReceipt/CreateBookingReceipt";
import UpdateBookingReceipt from "@/modules/Booking/BookingReceipt/EditBookingReceipt";
import BranchList from "@/modules/Branch/BranchList";
import TourList from "@/modules/Tour/TourList";
import CreateTour from "@/modules/Tour/CreateTour";
import EditTour from "@/modules/Tour/EditTour";

import { Toaster } from "sonner";
import "./App.css";
import PackageList from "./modules/Package/PackageList";
import Countries from "./modules/Country/CountryList";
import Cities from "./modules/City/CityList";
import State from "./modules/State/StateList";
import Sector from "./modules/Sector/SectorList";
import Accommodation from "./modules/Accommodation/AccommodationList";
import VehicleList from "@/modules/Vehicle/VehicleList";
import AirlineList from "@/modules/Airline/AirlineList";
import BankList from "@/modules/Bank/BankList";
import ServiceList from "@/modules/Service/ServiceList";
import StaffList from "./modules/Staff/StaffList";
import EditTourMember from "./modules/Booking/TourMembers/EditTourMember";
import TourEnquiryList from "./modules/Booking/TourEnquiryList";

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
            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <StaffList />
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
              path="/agencies/profile/:agencyId"
              element={
                <ProtectedRoute>
                  <AgencyProfile />
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

            <Route
              path="/cities"
              element={
                <ProtectedRoute>
                  <Cities />
                </ProtectedRoute>
              }
            />

            <Route
              path="/branches"
              element={
                <ProtectedRoute>
                  <BranchList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/states"
              element={
                <ProtectedRoute>
                  <State />
                </ProtectedRoute>
              }
            />

            <Route
              path="/sectors"
              element={
                <ProtectedRoute>
                  <Sector />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accommodations"
              element={
                <ProtectedRoute>
                  <Accommodation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vehicles"
              element={
                <ProtectedRoute>
                  <VehicleList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/airlines"
              element={
                <ProtectedRoute>
                  <AirlineList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/banks"
              element={
                <ProtectedRoute>
                  <BankList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <ServiceList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hotels"
              element={
                <ProtectedRoute>
                  <HotelList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hotels/create"
              element={
                <ProtectedRoute>
                  <CreateHotel />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hotels/:id/edit"
              element={
                <ProtectedRoute>
                  <EditHotel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <ClientList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/create"
              element={
                <ProtectedRoute>
                  <CreateClient />
                </ProtectedRoute>
              }
            />

            <Route
              path="/clients/:id/edit"
              element={
                <ProtectedRoute>
                  <EditClient />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tours"
              element={
                <ProtectedRoute>
                  <TourList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tours/enquiries"
              element={
                <ProtectedRoute>
                  <TourEnquiryList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tours/create"
              element={
                <ProtectedRoute>
                  <CreateTour />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tours/:id/edit"
              element={
                <ProtectedRoute>
                  <EditTour />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <BookingList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/create"
              element={
                <ProtectedRoute>
                  <CreateBooking />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bookings/:id/edit"
              element={
                <ProtectedRoute>
                  <EditBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/followUp"
              element={
                <ProtectedRoute>
                  <AddFollowUp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/details"
              element={
                <ProtectedRoute>
                  <BookingDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/journeyBooking/create"
              element={
                <ProtectedRoute>
                  <CreateJourneyBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/journeyBooking/:journeyBookingId/edit"
              element={
                <ProtectedRoute>
                  <UpdateJourneyBooking />
                </ProtectedRoute>
              }
            />

            {/* hotel booking satrt */}
            <Route
              path="/bookings/:id/hotelBooking/create"
              element={
                <ProtectedRoute>
                  <CreateHotelBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/hotelBooking/:hotelBookingId/edit"
              element={
                <ProtectedRoute>
                  <UpdateHotelBooking />
                </ProtectedRoute>
              }
            />
            {/* hotel booking end */}

            {/* Service booking satrt */}
            <Route
              path="/bookings/:id/serviceBooking/create"
              element={
                <ProtectedRoute>
                  <CreateServiceBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/serviceBooking/:serviceBookingId/edit"
              element={
                <ProtectedRoute>
                  <UpdateServiceBooking />
                </ProtectedRoute>
              }
            />
            {/* Service booking end */}
            <Route
              path="/agents"
              element={
                <ProtectedRoute>
                  <AgentList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/agents/create"
              element={
                <ProtectedRoute>
                  <CreateAgent />
                </ProtectedRoute>
              }
            />

            <Route
              path="/agents/:id/edit"
              element={
                <ProtectedRoute>
                  <EditAgent />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bookings/:id/vehicleBooking/create"
              element={
                <ProtectedRoute>
                  <CreateVehicleBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/vehicleBooking/:vehicleBookingId/edit"
              element={
                <ProtectedRoute>
                  <UpdateVehicleBooking />
                </ProtectedRoute>
              }
            />
            {/* travel document start */}
            <Route
              path="/bookings/:id/travelDocument/create"
              element={
                <ProtectedRoute>
                  <CreateTravelDocument />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/travelDocument/:travelDocumentId/edit"
              element={
                <ProtectedRoute>
                  <UpdateTravelDocument />
                </ProtectedRoute>
              }
            />
            {/* travel document end */}
            <Route
              path="/bookings/:id/tourMember/create"
              element={
                <ProtectedRoute>
                  <CreateTourMember />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/tourMember/:tourMemberId/edit"
              element={
                <ProtectedRoute>
                  <EditTourMember />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/bookingReceipt/create"
              element={
                <ProtectedRoute>
                  <CreateBookingReceipt />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id/bookingReceipt/:bookingReceiptId/edit"
              element={
                <ProtectedRoute>
                  <UpdateBookingReceipt />
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
