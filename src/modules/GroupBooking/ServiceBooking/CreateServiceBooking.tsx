import React from "react";
import ServiceBookingForm from "./ServiceBookingForm";

const CreateServiceBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Service Booking</h1>
      <ServiceBookingForm mode="create" />
    </div>
  );
};

export default CreateServiceBooking;
