import React from "react";
import TourMemberForm from "./TourMemberForm";

const EditTourMember = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Tour Member</h1>
      <TourMemberForm mode="edit" />
    </div>
  );
};

export default EditTourMember;
