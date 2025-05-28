import React from "react";
import BookingForm from "./BookingForm";

const CreateBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Booking</h1>
      <BookingForm mode="create" />
    </div>
  );
};

export default CreateBooking;
