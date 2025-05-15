import React from "react";
import TravelDocumentForm from "./TravelDocumentForm";

const EditTravelDocument = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Travel Document</h1>
      <TravelDocumentForm mode="edit" />
    </div>
  );
};

export default EditTravelDocument;
