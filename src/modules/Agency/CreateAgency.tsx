import React from "react";
import UserForm from "./AgencyForm";

const CreateUser = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Agency</h1>
      <UserForm mode="create" />
    </div>
  );
};

export default CreateUser;


