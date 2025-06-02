import React from "react";
import GroupClientVehicleBookingForm from "./GroupClientVehicleBookingForm";

const CreateGroupClientVehicleBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Vehicle booking</h1>
      <GroupClientVehicleBookingForm mode="create" />
    </div>
  );
};

export default CreateGroupClientVehicleBooking;
