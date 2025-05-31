import React from "react";
import GroupClientTravelDocumentForm from "./GroupClientTravelDocumentForm";

const EditGroupClientTravelDocument = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Travel Document</h1>
      <GroupClientTravelDocumentForm mode="edit" />
    </div>
  );
};

export default EditGroupClientTravelDocument;
