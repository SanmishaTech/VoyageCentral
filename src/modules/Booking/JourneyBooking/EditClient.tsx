import React from "react";
import ClientForm from "./ClientForm";

const EditClient = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Client</h1>
      <ClientForm mode="edit" />
    </div>
  );
};

export default EditClient;
