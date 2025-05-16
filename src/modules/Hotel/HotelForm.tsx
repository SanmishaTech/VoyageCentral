import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Validate from "@/lib/Handlevalidation";

import { LoaderCircle } from "lucide-react"; // Import the LoaderCircle icon
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";
import { set } from "date-fns";

const FormSchema = z.object({
  hotelName: z
    .string()
    .min(1, "Hotel Name cannot be left blank.")
    .max(100, "Hotel Name must not exceed 100 characters."),

  hotelAddressLine1: z
    .string()
    .min(1, "Address Line 1 is required.")
    .max(255, "Address Line 1 cannot exceed 255 characters.")
    .optional(),
  hotelAddressLine2: z
    .string()
    .max(255, "Address Line 2 cannot exceed 255 characters.")
    .optional(),
  hotelAddressLine3: z
    .string()
    .max(255, "Address Line 3 cannot exceed 255 characters.")
    .optional(),
  hotelCountry: z.string().max(100, "Country name is too long.").optional(),
  hotelState: z.string().max(100, "State name is too long.").optional(),
  hotelCity: z.string().max(100, "City name is too long.").optional(),
  // hotelPincode: z.string().max(15, "Pincode is too long.").optional(),

  officeAddressLine1: z
    .string()
    .max(255, "Office Address Line 1 cannot exceed 255 characters.")
    .optional(),
  officeAddressLine2: z
    .string()
    .max(255, "Office Address Line 2 cannot exceed 255 characters.")
    .optional(),
  officeAddressLine3: z
    .string()
    .max(255, "Office Address Line 3 cannot exceed 255 characters.")
    .optional(),
  officeCountry: z
    .string()
    .max(100, "Office country name is too long.")
    .optional(),
  officeState: z.string().max(100, "Office state name is too long.").optional(),
  officeCity: z.string().max(100, "Office city name is too long.").optional(),
  officePincode: z.string().max(15, "Office pincode is too long.").optional(),

  contactPerson: z
    .string()
    .max(100, "Contact person name is too long.")
    .optional(),
  contactPersonName2: z
    .string()
    .max(100, "Contact person name is too long.")
    .optional(),
  contactPersonEmail: z
    .string()
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "email must be a valid email address..",
    })
    .optional(),
  contactPersonEmail2: z
    .string()
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "email must be a valid email address..",
    })
    .optional(),
  contactPersonMobile: z
    .string()
    .max(15, "Mobile number is too long.")
    .optional(),
  contactPersonMobile2: z
    .string()
    .max(15, "Mobile number is too long.")
    .optional(),

  hotelContactNo1: z
    .string()
    .max(20, "Hotel contact number 1 is too long.")
    .optional(),
  hotelContactNo2: z
    .string()
    .max(20, "Hotel contact number 2 is too long.")
    .optional(),
  officeContactNo1: z
    .string()
    .max(20, "Office contact number 1 is too long.")
    .optional(),
  officeContactNo2: z
    .string()
    .max(20, "Office contact number 2 is too long.")
    .optional(),

  email1: z
    .string()
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Primary email must be a valid email address..",
    })
    .optional(),

  email2: z
    .string()
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Secondary email must be a valid email address..",
    })
    .optional(),

  website: z
    .string()
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
      message: "Website must be a valid URL.",
    })
    .optional(),
  panNumber: z
    .string()
    .refine((val) => val === "" || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val), {
      message: "Invalid PAN number format. Example: ABCDE1234F",
    }),
  hotelPincode: z
    .string()
    .min(1, "pincode field is required")
    .max(15, "Pincode is too long."),
  bank1Id: z
    .string()
    .min(1, "Bank Name Field is required")
    .max(100, "Bank name is too long."),
  // bankAccountNumber1: z
  //   .string()
  //   .refine((val) => val === "" || /^[0-9]{8,18}$/.test(val), {
  //     message:
  //       "Invalid bank account number format. Must be between 8 and 18 digits.",
  //   })
  //   .optional(),
  // branch1: z.string().max(100, "Branch name is too long.").optional(),
  // beneficiaryName1: z
  //   .string()
  //   .max(100, "Beneficiary name is too long.")
  //   .optional(),

  // ifsc_code1: z
  //   .string()
  //   .refine((val) => val === "" || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), {
  //     message: "Invalid IFSC code format. Example: SBIN0001234",
  //   }),

  // swiftCode1: z
  //   .string()
  //   .refine(
  //     (val) =>
  //       val === "" || /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(val),
  //     {
  //       message: "Invalid SWIFT code format. Example: SBININBBXXX or SBININBB",
  //     }
  //   ),
  bankAccountNumber1: z.string().refine((val) => /^[0-9]{8,18}$/.test(val), {
    message: "Invalid bank account number. Must be 8-18 digits.",
  }),

  branch1: z
    .string()
    .min(1, "Branch 1 field is required")
    .max(100, "Branch name is too long."),

  beneficiaryName1: z
    .string()
    .min(1, "Beneficiary name field is required")
    .max(100, "Beneficiary name is too long."),

  ifsc_code1: z.string().refine((val) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), {
    message: "Invalid IFSC code format. Example: SBIN0001234",
  }),

  swiftCode1: z
    .string()
    .refine((val) => /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(val), {
      message: "Invalid SWIFT code format. Example: SBININBBXXX or SBININBB",
    }),

  // bank1Id: z.union([
  //   z.number().min(1, { message: "Bank Name field is required." }),
  //   z.string().min(1, { message: "Bank Name field is required." }),
  // ]),
  bank2Id: z.string().max(100, "Bank name is too long.").optional(),
  bankAccountNumber2: z
    .string()
    .refine((val) => val === "" || /^[0-9]{8,18}$/.test(val), {
      message:
        "Invalid bank account number format. Must be between 8 and 18 digits.",
    })
    .optional(),
  branch2: z.string().max(100, "Branch name is too long.").optional(),
  beneficiaryName2: z
    .string()
    .max(100, "Beneficiary name is too long.")
    .optional(),

  ifsc_code2: z
    .string()
    .refine((val) => val === "" || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), {
      message: "Invalid IFSC code format. Example: SBIN0001234",
    }),

  swiftCode2: z
    .string()
    .refine(
      (val) =>
        val === "" || /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(val),
      {
        message: "Invalid SWIFT code format. Example: SBININBBXXX or SBININBB",
      }
    ),
});

type FormInputs = z.infer<typeof FormSchema>;

const HotelForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const [hotelCountryId, setHotelCountryId] = useState<string | null>(null);
  const [officeCountryId, setOfficeCountryId] = useState<string | null>(null);
  const [hotelStateId, setHotelStateId] = useState<string | null>(null);
  const [officeStateId, setOfficeStateId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const defaultValues: z.infer<typeof FormSchema> = {
    hotelName: "",

    hotelAddressLine1: "",
    hotelAddressLine2: "",
    hotelAddressLine3: "",
    hotelCountry: "",
    hotelState: "",
    hotelCity: "",
    hotelPincode: "",

    officeAddressLine1: "",
    officeAddressLine2: "",
    officeAddressLine3: "",
    officeCountry: "",
    officeState: "",
    officeCity: "",
    officePincode: "",

    contactPerson: "",
    contactPersonName2: "",
    contactPersonEmail: "",
    contactPersonEmail2: "",
    contactPersonMobile: "",
    contactPersonMobile2: "",

    hotelContactNo1: "",
    hotelContactNo2: "",
    officeContactNo1: "",
    officeContactNo2: "",

    email1: "",
    email2: "",
    website: "",
    panNumber: "",

    bank1Id: "",
    bankAccountNumber1: "",
    branch1: "",
    beneficiaryName1: "",
    ifscCode1: "",
    swiftCode1: "",

    bank2Id: "",
    bankAccountNumber2: "",
    branch2: "",
    beneficiaryName2: "",
    ifsc_code2: "",
    swiftCode2: "",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(FormSchema),
    defaultValues: mode === "create" ? defaultValues : undefined, // Use default values in create mode
  });

  const { data: editHotelData, isLoading: editHotelLoading } = useQuery({
    queryKey: ["editHotel", id],
    queryFn: async () => {
      const response = await get(`/hotels/${id}`);
      return response; // API returns the sector object directly
    },
    enabled: !!id && mode === "edit",
  });

  // banks
  const { data: banks, isLoading: isBanksLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const response = await get(`/banks/all`);
      return response;
    },
  });

  // countries
  const { data: countries, isLoading: isCountriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await get(`/countries/all`);
      return response; // API returns the sector object directly
    },
  });

  // hotel states
  const { data: hotelStates, isLoading: isHotelStatesLoading } = useQuery({
    queryKey: ["hotelStates", hotelCountryId],
    queryFn: async () => {
      const response = await get(`/states/by-country/${hotelCountryId}`);
      return response; // API returns the sector object directly
    },
    enabled: !!hotelCountryId,
  });

  // office states
  const { data: officeStates, isLoading: isOfficeStatesLoading } = useQuery({
    queryKey: ["officeStates", officeCountryId],
    queryFn: async () => {
      const response = await get(`/states/by-country/${officeCountryId}`);
      return response; // API returns the sector object directly
    },
    enabled: !!officeCountryId,
  });

  // hotel cities
  const { data: hotelCities, isLoading: isHotelCitiesLoading } = useQuery({
    queryKey: ["hotelCities", hotelStateId],
    queryFn: async () => {
      const response = await get(`/cities/by-state/${hotelStateId}`);
      return response; // API returns the sector object directly
    },
    enabled: !!hotelStateId,
  });

  // office cities
  const { data: officeCities, isLoading: isOfficeCitiesLoading } = useQuery({
    queryKey: ["officeCities", officeStateId],
    queryFn: async () => {
      const response = await get(`/cities/by-state/${officeStateId}`);
      return response; // API returns the sector object directly
    },
    enabled: !!officeStateId,
  });

  useEffect(() => {
    if (editHotelData) {
      setHotelCountryId(String(editHotelData.hotelCountryId) || "");
      setOfficeCountryId(String(editHotelData.officeCountryId) || "");
      setHotelStateId(String(editHotelData.hotelStateId) || "");
      setOfficeStateId(String(editHotelData.officeStateId) || "");

      reset({
        hotelName: editHotelData.hotelName || "",
        hotelAddressLine1: editHotelData.hotelAddressLine1 || "",
        hotelAddressLine2: editHotelData.hotelAddressLine2 || "",
        hotelAddressLine3: editHotelData.hotelAddressLine3 || "",

        hotelPincode: editHotelData.hotelPincode || "",
        officeAddressLine1: editHotelData.officeAddressLine1 || "",
        officeAddressLine2: editHotelData.officeAddressLine2 || "",
        officeAddressLine3: editHotelData.officeAddressLine3 || "",

        officePincode: editHotelData.officePincode || "",
        contactPerson: editHotelData.contactPerson || "",
        contactPersonEmail: editHotelData.contactPersonEmail || "",
        contactPersonMobile: editHotelData.contactPersonMobile || "",
        contactPersonName2: editHotelData.contactPersonName2 || "",
        contactPersonEmail2: editHotelData.contactPersonEmail2 || "",
        contactPersonMobile2: editHotelData.contactPersonMobile2 || "",

        hotelContactNo1: editHotelData.hotelContactNo1 || "",
        hotelContactNo2: editHotelData.hotelContactNo2 || "",
        officeContactNo1: editHotelData.officeContactNo1 || "",
        officeContactNo2: editHotelData.officeContactNo2 || "",
        email1: editHotelData.email1 || "",
        email2: editHotelData.email2 || "",
        website: editHotelData.website || "",
        panNumber: editHotelData.panNumber || "",
        bankAccountNumber1: editHotelData.bankAccountNumber1 || "",
        branch1: editHotelData.branch1 || "",
        beneficiaryName1: editHotelData.beneficiaryName1 || "",
        ifsc_code1: editHotelData.ifsc_code1 || "",
        swiftCode1: editHotelData.swiftCode1 || "",
        bankAccountNumber2: editHotelData.bankAccountNumber2 || "",
        branch2: editHotelData.branch2 || "",
        beneficiaryName2: editHotelData.beneficiaryName2 || "",
        ifsc_code2: editHotelData.ifsc_code2 || "",
        swiftCode2: editHotelData.swiftCode2 || "",
        bank1Id: editHotelData.bank1Id ? String(editHotelData.bank1Id) : "",
        bank2Id: editHotelData.bank2Id ? String(editHotelData.bank2Id) : "",
        officeCountry: editHotelData.officeCountryId
          ? String(editHotelData.officeCountryId)
          : "",
        hotelCountry: editHotelData.hotelCountryId
          ? String(editHotelData.hotelCountryId)
          : "",
        hotelState: editHotelData.hotelStateId
          ? String(editHotelData.hotelStateId)
          : "",
        officeState: editHotelData.officeStateId
          ? String(editHotelData.officeStateId)
          : "",
        hotelCity: editHotelData.hotelCityId
          ? String(editHotelData.hotelCityId)
          : "",
        officeCity: editHotelData.officeCityId
          ? String(editHotelData.officeCityId)
          : "",
      });
    }
  }, [editHotelData, reset]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post("/hotels", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["hotels"]); // Refetch the users list
      toast.success("Hotel created successfully");
      navigate("/hotels"); // Navigate to the hotels page after successful creation
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to create Hotel");
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) => put(`/hotels/${id}`, data),
    onSuccess: () => {
      toast.success("Hotel updated successfully");
      queryClient.invalidateQueries(["hotels"]);
      navigate("/hotels"); // Navigate to the hotels page after successful update
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update Hotel");
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (mode === "create") {
      createMutation.mutate(data); // Trigger create mutation
    } else {
      updateMutation.mutate(data); // Trigger update mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // if (
  //   mode === "edit" &&
  //   !hotelCities?.length &&
  //   !hotelStates?.length &&
  //   !officeCities?.length &&
  //   !officeStates?.length
  // ) {
  //   return <></>;
  // }
  return (
    <>
      {/* JSX Code for HotelForm.tsx */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10 min-w-5xl">
          <CardContent className="pt-6">
            {/* Hotel Details */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Hotel Details
            </CardTitle>
            <div className="grid gap-4 mt-4">
              {/* Hotel Name */}
              <div>
                <Label
                  htmlFor="hotelName"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Hotel Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hotelName"
                  {...register("hotelName")}
                  placeholder="Enter hotel name"
                />
                {errors.hotelName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.hotelName.message}
                  </p>
                )}
              </div>
              {/* Two Columns: Hotel Address Details and Office Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hotel Address Details */}
                <div>
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Hotel Address Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="hotelAddressLine1"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Address Line 1 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="hotelAddressLine1"
                        {...register("hotelAddressLine1")}
                        placeholder="Enter address line 1"
                      />
                      {errors.hotelAddressLine1 && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.hotelAddressLine1.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="hotelAddressLine2"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Address Line 2
                      </Label>
                      <Input
                        id="hotelAddressLine2"
                        {...register("hotelAddressLine2")}
                        placeholder="Enter address line 2"
                      />
                      {errors.hotelAddressLine2 && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.hotelAddressLine2.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="hotelAddressLine3"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Address Line 3
                      </Label>
                      <Input
                        id="hotelAddressLine3"
                        {...register("hotelAddressLine3")}
                        placeholder="Enter address line 3"
                      />
                      {errors.hotelAddressLine3 && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.hotelAddressLine3.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="hotelCountry"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Country
                      </Label>
                      <Controller
                        name="hotelCountry"
                        control={control}
                        render={({ field }) => (
                          <Select
                            key={field.value || ""}
                            onValueChange={(value) => {
                              setValue("hotelCountry", value);
                              setValue("hotelState", "");
                              setValue("hotelCity", "");
                              setHotelCountryId(value);
                            }}
                            value={watch("hotelCountry") || ""}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries?.length > 0 &&
                                countries?.map((country) => (
                                  <SelectItem
                                    key={country.id}
                                    value={String(country.id)}
                                  >
                                    {country.countryName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="hotelState"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        State
                      </Label>
                      <Controller
                        name="hotelState"
                        control={control}
                        render={({ field }) => (
                          <Select
                            key={field.value || ""}
                            onValueChange={(value) => {
                              setValue("hotelState", value);

                              setHotelStateId(value);

                              setValue("hotelCity", "");
                            }}
                            value={watch("hotelState")}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a state" />
                            </SelectTrigger>
                            <SelectContent>
                              {hotelStates?.map((state) => (
                                <SelectItem
                                  key={state.id}
                                  value={String(state.id)}
                                >
                                  {state.stateName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="hotelCity"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        City
                      </Label>
                      <Controller
                        name="hotelCity"
                        control={control}
                        render={({ field }) => (
                          <Select
                            key={field.value}
                            onValueChange={(value) =>
                              setValue("hotelCity", value)
                            }
                            value={watch("hotelCity")}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a city" />
                            </SelectTrigger>
                            <SelectContent>
                              {hotelCities?.map((city) => (
                                <SelectItem
                                  key={city.id}
                                  value={String(city.id)}
                                >
                                  {city.cityName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="hotelPincode"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Pincode <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="hotelPincode"
                        {...register("hotelPincode")}
                        placeholder="Enter pincode"
                      />
                      {errors.hotelPincode && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.hotelPincode.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Office Address Details */}
                <div>
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Office Address Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="officeAddressLine1"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Address Line 1
                      </Label>
                      <Input
                        id="officeAddressLine1"
                        {...register("officeAddressLine1")}
                        placeholder="Enter address line 1"
                      />
                      {errors.officeAddressLine1 && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.officeAddressLine1.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="officeAddressLine2"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Address Line 2
                      </Label>
                      <Input
                        id="officeAddressLine2"
                        {...register("officeAddressLine2")}
                        placeholder="Enter address line 2"
                      />
                      {errors.officeAddressLine2 && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.officeAddressLine2.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="officeAddressLine3"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Address Line 3
                      </Label>
                      <Input
                        id="officeAddressLine3"
                        {...register("officeAddressLine3")}
                        placeholder="Enter address line 3"
                      />
                      {errors.officeAddressLine3 && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.officeAddressLine3.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="officeCountry"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Country
                      </Label>
                      <Controller
                        name="officeCountry"
                        control={control}
                        render={({ field }) => (
                          <Select
                            key={field.value}
                            onValueChange={(value) => {
                              setValue("officeCountry", value);
                              setOfficeCountryId(value);

                              setValue("officeState", "");
                              setValue("officeCity", "");
                            }}
                            value={watch("officeCountry")}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries?.length > 0 &&
                                countries?.map((country) => (
                                  <SelectItem
                                    key={country.id}
                                    value={String(country.id)}
                                  >
                                    {country.countryName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="officeState"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        State
                      </Label>
                      <Controller
                        name="officeState"
                        control={control}
                        render={({ field }) => (
                          <Select
                            key={field.value}
                            onValueChange={(value) => {
                              setValue("officeState", value);

                              setOfficeStateId(value);

                              setValue("officeCity", "");
                            }}
                            value={watch("officeState")}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a state" />
                            </SelectTrigger>
                            <SelectContent>
                              {officeStates?.map((state) => (
                                <SelectItem
                                  key={state.id}
                                  value={String(state.id)}
                                >
                                  {state.stateName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="officeCity"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        City
                      </Label>
                      <Controller
                        name="officeCity"
                        control={control}
                        render={({ field }) => (
                          <Select
                            key={field.value}
                            onValueChange={(value) =>
                              setValue("officeCity", value)
                            }
                            value={watch("officeCity")}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a city" />
                            </SelectTrigger>
                            <SelectContent>
                              {officeCities?.map((city) => (
                                <SelectItem
                                  key={city.id}
                                  value={String(city.id)}
                                >
                                  {city.cityName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="officePincode"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Pincode
                      </Label>
                      <Input
                        id="officePincode"
                        {...register("officePincode")}
                        placeholder="Enter pincode"
                      />
                      {errors.officePincode && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.officePincode.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mt-5 mb-4">
                Contact Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Contact Person */}
                  <div>
                    <Label
                      htmlFor="contactPerson"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Contact Person Name 1
                    </Label>
                    <Input
                      id="contactPerson"
                      {...register("contactPerson")}
                      placeholder="Enter name"
                    />
                    {errors.contactPerson && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.contactPerson.message}
                      </p>
                    )}
                  </div>
                  {/* COntact person Email */}
                  <div>
                    <Label
                      htmlFor="contactPersonEmail"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Contact Person Email 1
                    </Label>
                    <Input
                      id="contactPersonEmail"
                      {...register("contactPersonEmail")}
                      placeholder="Enter email"
                    />
                    {errors.contactPersonEmail && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.contactPersonEmail.message}
                      </p>
                    )}
                  </div>
                  {/* Contact person Mobile */}
                  <div>
                    <Label
                      htmlFor="contactPersonMobile"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Contact Person Mobile 1
                    </Label>
                    <Input
                      id="contactPersonMobile"
                      {...register("contactPersonMobile")}
                      placeholder="Enter number"
                    />
                    {errors.contactPersonMobile && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.contactPersonMobile.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Contact Person 2 */}
                  <div>
                    <Label
                      htmlFor="contactPersonName2"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Contact Person 2
                    </Label>
                    <Input
                      id="contactPersonName2"
                      {...register("contactPersonName2")}
                      placeholder="Enter name"
                    />
                    {errors.contactPersonName2 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.contactPersonName2.message}
                      </p>
                    )}
                  </div>
                  {/* COntact person Email 2 */}
                  <div>
                    <Label
                      htmlFor="contactPersonEmail2"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Contact Person Email 2
                    </Label>
                    <Input
                      id="contactPersonEmail2"
                      {...register("contactPersonEmail2")}
                      placeholder="Enter email"
                    />
                    {errors.contactPersonEmail2 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.contactPersonEmail2.message}
                      </p>
                    )}
                  </div>
                  {/* Contact person Mobile 2 */}
                  <div>
                    <Label
                      htmlFor="contactPersonMobile2"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Contact Person Mobile 2
                    </Label>
                    <Input
                      id="contactPersonMobile2"
                      {...register("contactPersonMobile2")}
                      placeholder="Enter number"
                    />
                    {errors.contactPersonMobile2 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.contactPersonMobile2.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label
                      htmlFor="hotelContactNo1"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Hotel Contact No 1
                    </Label>
                    <Input
                      id="hotelContactNo1"
                      {...register("hotelContactNo1")}
                      placeholder="Enter hotel contact no 1"
                    />
                    {errors.hotelContactNo1 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.hotelContactNo1.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="hotelContactNo2"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Hotel Contact No 2
                    </Label>
                    <Input
                      id="hotelContactNo2"
                      {...register("hotelContactNo2")}
                      placeholder="Enter hotel contact no 2"
                    />
                    {errors.hotelContactNo2 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.hotelContactNo2.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="officeContactNo1"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Office Contact No 1
                    </Label>
                    <Input
                      id="officeContactNo1"
                      {...register("officeContactNo1")}
                      placeholder="Enter office contact no 1"
                    />
                    {errors.officeContactNo1 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.officeContactNo1.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="officeContactNo2"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Office Contact No 2
                    </Label>
                    <Input
                      id="officeContactNo2"
                      {...register("officeContactNo2")}
                      placeholder="Enter office contact no 2"
                    />
                    {errors.officeContactNo2 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.officeContactNo2.message}
                      </p>
                    )}
                  </div>
                </div>
                {/* Emails */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="email1"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email 1
                    </Label>
                    <Input
                      id="email1"
                      {...register("email1")}
                      placeholder="Enter primary email"
                    />
                    {errors.email1 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.email1.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="email2"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email 2
                    </Label>
                    <Input
                      id="email2"
                      {...register("email2")}
                      placeholder="Enter secondary email"
                    />
                    {errors.email2 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.email2.message}
                      </p>
                    )}
                  </div>
                </div>
                {/* Website and PAN Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="website"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Website
                    </Label>
                    <Input
                      id="website"
                      {...register("website")}
                      placeholder="Enter website URL"
                    />
                    {errors.website && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.website.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="panNumber"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      PAN Number
                    </Label>
                    <Input
                      id="panNumber"
                      {...register("panNumber")}
                      placeholder="Enter PAN number"
                    />
                    {errors.panNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.panNumber.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Bank Details */}
            {/* Bank Details 1 */}
            <div>
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mt-5 mb-4">
                Bank Details 1
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="bank1Id"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Bank Name <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="bank1Id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        key={field.value}
                        onValueChange={(value) => {
                          setValue("bank1Id", value);
                        }}
                        value={watch("bank1Id")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks?.map((bank) => (
                            <SelectItem key={bank.id} value={String(bank.id)}>
                              {bank.bankName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.bank1Id && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.bank1Id.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="bankAccountNumber1"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Bank Account Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bankAccountNumber1"
                    {...register("bankAccountNumber1")}
                    placeholder="Enter bank account number"
                  />
                  {errors.bankAccountNumber1 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.bankAccountNumber1.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="branch1"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Branch <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="branch1"
                    {...register("branch1")}
                    placeholder="Enter branch name"
                  />
                  {errors.branch1 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.branch1.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="beneficiaryName1"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Beneficiary Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="beneficiaryName1"
                    {...register("beneficiaryName1")}
                    placeholder="Enter beneficiary name"
                  />
                  {errors.beneficiaryName1 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.beneficiaryName1.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="ifsc_code1"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    IFSC Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ifsc_code1"
                    {...register("ifsc_code1")}
                    placeholder="Enter IFSC code"
                  />
                  {errors.ifsc_code1 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.ifsc_code1.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="swiftCode1"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    SWIFT Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="swiftCode1"
                    {...register("swiftCode1")}
                    placeholder="Enter SWIFT code"
                  />
                  {errors.swiftCode1 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.swiftCode1.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Details 2 */}
            <div>
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mt-5 mb-4">
                Bank Details 2
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="bank2Id"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Bank Name
                  </Label>
                  <Controller
                    name="bank2Id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        key={field.value}
                        onValueChange={(value) => {
                          setValue("bank2Id", value);
                        }}
                        value={watch("bank2Id")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks?.map((bank) => (
                            <SelectItem key={bank.id} value={String(bank.id)}>
                              {bank.bankName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="bankAccountNumber2"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Bank Account Number
                  </Label>
                  <Input
                    id="bankAccountNumber2"
                    {...register("bankAccountNumber2")}
                    placeholder="Enter bank account number"
                  />
                  {errors.bankAccountNumber2 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.bankAccountNumber2.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="branch2"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Branch
                  </Label>
                  <Input
                    id="branch2"
                    {...register("branch2")}
                    placeholder="Enter branch name"
                  />
                  {errors.branch2 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.branch2.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="beneficiaryName2"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Beneficiary Name
                  </Label>
                  <Input
                    id="beneficiaryName2"
                    {...register("beneficiaryName2")}
                    placeholder="Enter beneficiary name"
                  />
                  {errors.beneficiaryName2 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.beneficiaryName2.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="ifsc_code2"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    IFSC Code
                  </Label>
                  <Input
                    id="ifsc_code2"
                    {...register("ifsc_code2")}
                    placeholder="Enter IFSC code"
                  />
                  {errors.ifsc_code2 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.ifsc_code2.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="swiftCode2"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    SWIFT Code
                  </Label>
                  <Input
                    id="swiftCode2"
                    {...register("swiftCode2")}
                    placeholder="Enter SWIFT code"
                  />
                  {errors.swiftCode2 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.swiftCode2.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/hotels")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[90px]">
              {isLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : mode === "create" ? (
                "Create Hotel"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
};

export default HotelForm;
