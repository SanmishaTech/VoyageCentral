import React from "react";
import GroupClientJourneyBookingForm from "./GroupClientJourneyBookingForm";

const EditGroupClientJourneyBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Journey booking</h1>
      <GroupClientJourneyBookingForm mode="edit" />
    </div>
  );
};

export default EditGroupClientJourneyBooking;
