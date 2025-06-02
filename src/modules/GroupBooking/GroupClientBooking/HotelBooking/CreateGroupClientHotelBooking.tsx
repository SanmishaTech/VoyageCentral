import React from "react";
import GroupClientHotelBookingForm from "./GroupClientHotelBookingForm";

const CreateGroupClientHotelBooking = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create hotel booking</h1>
      <GroupClientHotelBookingForm mode="create" />
    </div>
  );
};

export default CreateGroupClientHotelBooking;
