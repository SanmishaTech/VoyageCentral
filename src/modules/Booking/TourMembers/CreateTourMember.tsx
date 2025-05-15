import React from "react";
import TourMemberForm from "./TourMemberForm";

const CreateTourMember = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Add Tour Members</h1>
      <TourMemberForm />
    </div>
  );
};

export default CreateTourMember;
