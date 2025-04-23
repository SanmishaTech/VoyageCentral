import React from "react";
import ClientForm from "./ClientForm";

const CreateClient = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Client</h1>
      <ClientForm mode="create" />
    </div>
  );
};

export default CreateClient;
