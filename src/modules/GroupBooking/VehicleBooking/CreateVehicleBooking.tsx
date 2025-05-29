import React from "react";
import VehicleBookingForm from "./VehicleBookingForm";

const CreateVehicleBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Vehicle booking</h1>
      <VehicleBookingForm mode="create" />
    </div>
  );
};

export default CreateVehicleBooking;
