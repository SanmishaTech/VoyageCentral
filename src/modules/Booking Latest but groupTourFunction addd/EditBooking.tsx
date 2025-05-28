import React from "react";
import BookingForm from "./BookingForm";

const EditBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Booking</h1>
      <BookingForm mode="edit" />
    </div>
  );
};

export default EditBooking;
