import React from "react";
import AgentForm from "./AgentForm";

const EditAgent = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Agent</h1>
      <AgentForm mode="edit" />
    </div>
  );
};

export default EditAgent;
