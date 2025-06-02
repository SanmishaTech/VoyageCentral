import React from "react";
import GroupClientHotelBookingForm from "./GroupClientHotelBookingForm";

const EditGroupClientHotelBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Hotel booking</h1>
      <GroupClientHotelBookingForm mode="edit" />
    </div>
  );
};

export default EditGroupClientHotelBooking;
