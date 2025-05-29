import React from "react";
import GroupClientBookingForm from "./GroupClientBookingForm";

const CreateGroupClientBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Tour Booking Member</h1>
      <GroupClientBookingForm mode="create" />
    </div>
  );
};

export default CreateGroupClientBooking;
