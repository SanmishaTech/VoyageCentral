import React from "react";
import TravelDocumentForm from "./TravelDocumentForm";

const CreateTravelDocument = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Travel Document</h1>
      <TravelDocumentForm mode="create" />
    </div>
  );
};

export default CreateTravelDocument;
