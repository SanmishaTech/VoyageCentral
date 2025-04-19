import React from "react";
import HotelForm from "./HotelForm";

const CreateHotel = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Hotel</h1>
      <HotelForm mode="create" />
    </div>
  );
};

export default CreateHotel;
