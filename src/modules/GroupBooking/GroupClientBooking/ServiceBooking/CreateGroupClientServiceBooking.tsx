import React from "react";
import GroupClientServiceBookingForm from "./GroupClientServiceBookingForm";

const CreateGroupClientServiceBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Service Booking</h1>
      <GroupClientServiceBookingForm mode="create" />
    </div>
  );
};

export default CreateGroupClientServiceBooking;
