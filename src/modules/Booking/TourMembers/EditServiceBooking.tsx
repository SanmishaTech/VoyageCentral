import React from "react";
import ServiceBookingForm from "./ServiceBookingForm";

const EditServiceBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Service booking</h1>
      <ServiceBookingForm mode="edit" />
    </div>
  );
};

export default EditServiceBooking;
