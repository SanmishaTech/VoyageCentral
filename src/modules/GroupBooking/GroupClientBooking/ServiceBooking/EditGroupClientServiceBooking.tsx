import React from "react";
import GroupClientServiceBookingForm from "./GroupClientServiceBookingForm";

const EditGroupClientServiceBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Service booking</h1>
      <GroupClientServiceBookingForm mode="edit" />
    </div>
  );
};

export default EditGroupClientServiceBooking;
