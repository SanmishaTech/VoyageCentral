import React from "react";
import HotelBookingForm from "./HotelBookingForm";

const CreateHotelBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create hotel booking</h1>
      <HotelBookingForm mode="create" />
    </div>
  );
};

export default CreateHotelBooking;
