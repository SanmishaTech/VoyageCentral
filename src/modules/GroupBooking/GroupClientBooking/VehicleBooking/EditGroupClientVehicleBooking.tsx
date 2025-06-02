import React from "react";
import GroupClientVehicleBookingForm from "./GroupClientVehicleBookingForm";

const EditGroupClientVehicleBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Vehicle booking</h1>
      <GroupClientVehicleBookingForm mode="edit" />
    </div>
  );
};

export default EditGroupClientVehicleBooking;
