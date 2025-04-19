import React from "react";
import HotelForm from "./HotelForm";

const EditHotel = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Hotel</h1>
      <HotelForm mode="edit" />
    </div>
  );
};

export default EditHotel;
