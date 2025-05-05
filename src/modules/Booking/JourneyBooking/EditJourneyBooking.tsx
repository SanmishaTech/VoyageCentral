import React from "react";
import JourneyBookingForm from "./JourneyBookingForm";

const EditJourneyBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Journey booking</h1>
      <JourneyBookingForm mode="edit" />
    </div>
  );
};

export default EditJourneyBooking;
