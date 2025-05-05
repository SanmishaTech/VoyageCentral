import React from "react";
import HotelBookingForm from "./HotelBookingForm";

const EditHotelBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Hotel booking</h1>
      <HotelBookingForm mode="edit" />
    </div>
  );
};

export default EditHotelBooking;
