import React from "react";
import GroupBookingForm from "./GroupBookingForm";

const CreateGroupBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Group Booking</h1>
      <GroupBookingForm mode="create" />
    </div>
  );
};

export default CreateGroupBooking;
