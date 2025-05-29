import React from "react";
import GroupClientBookingForm from "./GroupClientBookingForm";

const EditGroupClientBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Tour booking Member</h1>
      <GroupClientBookingForm mode="edit" />
    </div>
  );
};

export default EditGroupClientBooking;
