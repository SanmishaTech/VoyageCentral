import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LoaderCircle } from "lucide-react"; // Import the LoaderCircle icon
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";
import { PasswordInput } from "@/components/ui/password-input";

type UserFormInputs = {
  businessName: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  city: string;
  pincode: string;
};

const userFormSchema = Joi.object({
  businessName: Joi.string().required().messages({
    "string.empty": "Business Name is required",
  }),
  addressLine1: Joi.string().required().messages({
    "string.empty": "Address Line 1 is required",
  }),
  addressLine2: Joi.string().required().messages({
    "string.empty": "Address Line 2 must be at least 6 characters long",
  }),
  state: Joi.string().required().messages({
    "string.empty": "State is required",
  }),
  city: Joi.string().required().messages({
    "string.empty": "City is required",
  }),
  pincode: Joi.string().required().messages({
    "string.empty": "Pincode is required",
  }),
});

const UserForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [roles, setRoles] = useState<string[]>([]); // Roles fetched from API
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormInputs>({
    resolver: joiResolver(userFormSchema),
  });

  const active = watch("active");

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoadingRoles(true);
        const rolesData = await get("/roles");
        const formattedRoles = Object.values(rolesData.roles); // Use only role values
        setRoles(formattedRoles);
      } catch (error: any) {
        toast.error("Failed to fetch roles");
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  // Fetch user data for edit mode
  useEffect(() => {
    if (mode === "edit" && id) {
      const fetchUser = async () => {
        try {
          const user = await get(`/agencies/${id}`);
          setValue("name", user.name);
          setValue("email", user.email);
          setValue("role", user.role);
          setValue("active", user.active);
        } catch (error: any) {
          toast.error("Failed to fetch user details");
        }
      };

      fetchUser();
    }
  }, [id, mode, setValue]);

  // Mutation for creating a user
  const createUserMutation = useMutation({
    mutationFn: (data: UserFormInputs) => post("/agencies", data),
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries(["agencies"]); // Refetch the agencies list
      navigate("/agencies");
    },
    onError: (error: any) => {
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create agency");
      }
    },
  });

  // Mutation for updating a user
  const updateUserMutation = useMutation({
    mutationFn: (data: UserFormInputs) => put(`/agencies/${id}`, data),
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries(["agencies"]); // Refetch the agencies list
      navigate("/agencies");
    },
    onError: (error: any) => {
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create agency");
      }
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<UserFormInputs> = (data) => {
    if (mode === "create") {
      createUserMutation.mutate(data); // Trigger create mutation
    } else {
      updateUserMutation.mutate(data); // Trigger update mutation
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="mx-auto mt-10">
        <CardContent>
          <CardTitle>Agency Details</CardTitle>
          <div className="grid gap-4 mt-5">
            {/* Agency Details Section */}
            <div>
              <Label htmlFor="businessName" className="mb-2 block">
                Business Name
              </Label>
              <Input
                id="businessName"
                type="text"
                placeholder="123 Main St"
                {...register("businessName")}
              />
              {errors.businessName && (
                <span className="text-red-500 text-sm">
                  {errors.businessName.message}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="addressLine1" className="mb-2 block">
                Address Line 1
              </Label>
              <Textarea
                id="addressLine1"
                placeholder="123 Main St"
                {...register("addressLine1")}
              />
              {errors.addressLine1 && (
                <span className="text-red-500 text-sm">
                  {errors.addressLine1.message}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="addressLine2" className="mb-2 block">
                Address Line 2
              </Label>
              <Textarea
                id="addressLine2"
                type="text"
                placeholder="Apartment, suite, etc."
                {...register("addressLine2")}
              />
              {errors.addressLine2 && (
                <span className="text-red-500 text-sm">
                  {errors.addressLine2.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <Label htmlFor="state" className="mb-2 block">
                  State
                </Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="California"
                  {...register("state")}
                />
                {errors.state && (
                  <span className="text-red-500 text-sm">
                    {errors.state.message}
                  </span>
                )}
              </div>

              <div>
                <Label htmlFor="city" className="mb-2 block">
                  City
                </Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Los Angeles"
                  {...register("city")}
                />
                {errors.city && (
                  <span className="text-red-500 text-sm">
                    {errors.city.message}
                  </span>
                )}
              </div>

              <div>
                <Label htmlFor="pincode" className="mb-2 block">
                  Pincode
                </Label>
                <Input
                  id="pincode"
                  type="text"
                  placeholder="90001"
                  {...register("pincode")}
                />
                {errors.pincode && (
                  <span className="text-red-500 text-sm">
                    {errors.pincode.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="my-6 border-gray-300" />

          {/* Contact Person Section */}
          <CardTitle className="mt-4 text-lg">Contact Person</CardTitle>
          <div className="grid grid-cols-3 gap-6 mt-5">
            {" "}
            {/* Updated to grid-cols-3 */}
            <div>
              <Label htmlFor="contactPersonName" className="mb-2 block">
                Contact Person Name
              </Label>
              <Input
                id="contactPersonName"
                type="text"
                placeholder="Jane Doe"
                {...register("contactPersonName")}
              />
              {errors.contactPersonName && (
                <span className="text-red-500 text-sm">
                  {errors.contactPersonName.message}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="contactPersonEmail" className="mb-2 block">
                Contact Person Email
              </Label>
              <Input
                id="contactPersonEmail"
                type="email"
                placeholder="jane.doe@example.com"
                {...register("contactPersonEmail")}
              />
              {errors.contactPersonEmail && (
                <span className="text-red-500 text-sm">
                  {errors.contactPersonEmail.message}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="contactPersonPhone" className="mb-2 block">
                Contact Person Phone
              </Label>
              <Input
                id="contactPersonPhone"
                type="text"
                placeholder="+1 234 567 890"
                {...register("contactPersonPhone")}
              />
              {errors.contactPersonPhone && (
                <span className="text-red-500 text-sm">
                  {errors.contactPersonPhone.message}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <hr className="my-6 border-gray-300" />

          {/* Create User Section */}
          <CardTitle className="mt-4 text-lg">Create User</CardTitle>
          <div className="grid gap-4 mt-5">
            <div>
              <Label htmlFor="name" className="mb-2 block">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name")}
              />
              {errors.name && (
                <span className="text-red-500 text-sm">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
              />
              {errors.email && (
                <span className="text-red-500 text-sm">
                  {errors.email.message}
                </span>
              )}
            </div>

            {mode === "create" && (
              <div>
                <Label htmlFor="password" className="mb-2 block">
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  placeholder="Enter a secure password"
                  {...register("password")}
                />
                {errors.password && (
                  <span className="text-red-500 text-sm">
                    {errors.password.message}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Submit and Cancel Buttons */}
      <div className="justify-end flex gap-4">
        <Button
          type="submit"
          disabled={
            createUserMutation.isLoading || updateUserMutation.isLoading
          }
          className="flex items-center justify-center gap-2"
        >
          {createUserMutation.isLoading || updateUserMutation.isLoading ? (
            <>
              <LoaderCircle className="animate-spin h-4 w-4" />
              Saving...
            </>
          ) : mode === "create" ? (
            "Create Agency"
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/agencies")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
