import React from "react";
import VehicleBookingForm from "./VehicleBookingForm";

const EditVehicleBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Vehicle booking</h1>
      <VehicleBookingForm mode="edit" />
    </div>
  );
};

export default EditVehicleBooking;
