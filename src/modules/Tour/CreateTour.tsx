import React from "react";
import TourForm from "./TourForm";

const CreateTour = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Tour</h1>
      <TourForm mode="create" />
    </div>
  );
};

export default CreateTour;
