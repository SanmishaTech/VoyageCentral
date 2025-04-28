import React from "react";
import TourForm from "./TourForm";

const EditTour = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Tour</h1>
      <TourForm mode="edit" />
    </div>
  );
};

export default EditTour;
