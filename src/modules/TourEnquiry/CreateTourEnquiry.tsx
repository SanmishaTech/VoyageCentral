import React from "react";
import TourEnquiryForm from "./TourEnquiryForm";

const CreateTourEnquiry = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Tour Enquiry</h1>
      <TourEnquiryForm mode="create" />
    </div>
  );
};

export default CreateTourEnquiry;
