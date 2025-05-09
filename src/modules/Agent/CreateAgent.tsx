import React from "react";
import AgentForm from "./AgentForm";

const CreateAgent = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Agent</h1>
      <AgentForm mode="create" />
    </div>
  );
};

export default CreateAgent;
