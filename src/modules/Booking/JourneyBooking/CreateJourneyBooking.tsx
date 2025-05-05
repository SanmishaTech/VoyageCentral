import React from "react";
import JourneyBookingForm from "./JourneyBookingForm";

const CreateJourneyBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create journey booking</h1>
      <JourneyBookingForm mode="create" />
    </div>
  );
};

export default CreateJourneyBooking;
