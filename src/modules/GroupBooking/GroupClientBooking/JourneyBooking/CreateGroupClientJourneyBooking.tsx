import React from "react";
import GroupClientJourneyBookingForm from "./GroupClientJourneyBookingForm";

const CreateGroupClientJourneyBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create journey booking</h1>
      <GroupClientJourneyBookingForm mode="create" />
    </div>
  );
};

export default CreateGroupClientJourneyBooking;
