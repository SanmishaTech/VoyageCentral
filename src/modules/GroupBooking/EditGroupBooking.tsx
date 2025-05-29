import React from "react";
import GroupBookingForm from "./GroupBookingForm";

const EditGroupBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Group Booking</h1>
      <GroupBookingForm mode="edit" />
    </div>
  );
};

export default EditGroupBooking;
