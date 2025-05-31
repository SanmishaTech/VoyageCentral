import React from "react";
import GroupClientTravelDocumentForm from "./GroupClientTravelDocumentForm";

const CreateGroupClientTravelDocument = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Travel Document</h1>
      <GroupClientTravelDocumentForm mode="create" />
    </div>
  );
};

export default CreateGroupClientTravelDocument;
