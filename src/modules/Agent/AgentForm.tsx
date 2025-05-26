import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Validate from "@/lib/Handlevalidation";

import { LoaderCircle, ChevronsUpDown, Check } from "lucide-react"; // Import the LoaderCircle icon
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";
import { set } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

const FormSchema = z.object({
  agentName: z
    .string()
    .min(1, "Agent Name cannot be left blank.")
    .max(100, "Agent Name must not exceed 100 characters."),

  addressLine1: z
    .string()
    .min(1, "address line 1 cannot be left blank.")
    .max(2000, "Address Line 1 cannot exceed 2000 characters."),

  addressLine2: z
    .string()
    .max(2000, "Address Line 2 cannot exceed 2000 characters.")
    .optional(),

  addressLine3: z
    .string()
    .max(2000, "Address Line 3 cannot exceed 2000 characters.")
    .optional(),
  isVehicle: z.boolean().optional(),
  isAirline: z.boolean().optional(),
  isTrain: z.boolean().optional(),

  countryId: z.union([
    z.number().min(1, { message: "Country field is required." }),
    z.string().min(1, { message: "Country field is required." }),
  ]),

  stateId: z.union([
    z.number().min(1, { message: "State field is required." }),
    z.string().min(1, { message: "State field is required." }),
  ]),

  cityId: z.union([
    z.number().min(1, { message: "City field is required." }),
    z.string().min(1, { message: "City field is required." }),
  ]),

  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits."),

  contactPersonName: z
    .string()
    .min(1, "name field is required")
    .max(100, "Contact person name is too long."),

  mobile1: z
    .string()
    .optional()
    .refine((val) => /^\d{10}$/.test(val), {
      message: "Mobile number must be exactly 10 digits.",
    }),
  mobile2: z
    .string()
    .optional()
    .refine((val) => val === "" || /^\d{10}$/.test(val), {
      message: "Mobile number must be exactly 10 digits.",
    }),

  email1: z.string().refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: "Primary email must be a valid email address.",
  }),

  email2: z
    .string()
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Secondary email must be a valid email address.",
    })
    .optional(),

  websiteName: z
    .string()
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
      message: "Website must be a valid URL.",
    })
    .optional(),

  panNumber: z.string().refine((val) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val), {
    message: "Invalid PAN number format. Example: ABCDE1234F",
  }),

  landlineNumber1: z
    .string()
    .optional()
    .refine((val) => val === "" || /^0\d{9,10}$/.test(val), {
      message: "Landline number 1 must be 10 or 11 digits and start with 0.",
    }),

  landlineNumber2: z
    .string()
    .optional()
    .refine((val) => val === "" || /^0\d{9,10}$/.test(val), {
      message: "Landline number 1 must be 10 or 11 digits and start with 0.",
    }),

  bank2Id: z.coerce.number().nullable(),

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

  ifscCode1: z.string().refine((val) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), {
    message: "Invalid IFSC code format. Example: SBIN0001234",
  }),

  swiftCode1: z
    .string()
    .refine((val) => /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(val), {
      message: "Invalid SWIFT code format. Example: SBININBBXXX or SBININBB",
    }),

  bank1Id: z.union([
    z.number().min(1, { message: "Bank Name field is required." }),
    z.string().min(1, { message: "Bank Name field is required." }),
  ]),

  bankAccountNumber2: z
    .string()
    .refine((val) => val === "" || /^[0-9]{8,18}$/.test(val), {
      message: "Invalid bank account number. Must be 8-18 digits.",
    })
    .optional(),

  branch2: z.string().max(100, "Branch name is too long.").optional(),

  beneficiaryName2: z
    .string()
    .max(100, "Beneficiary name is too long.")
    .optional(),

  ifscCode2: z
    .string()
    .refine((val) => val === "" || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), {
      message: "Invalid IFSC code format. Example: SBIN0001234",
    })
    .optional(),

  swiftCode2: z
    .string()
    .refine(
      (val) =>
        val === "" || /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(val),
      {
        message: "Invalid SWIFT code format. Example: SBININBBXXX or SBININBB",
      }
    )
    .optional(),
});

type FormInputs = z.infer<typeof FormSchema>;

const AgentForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const [openCountryId, setOpenCountryId] = useState<boolean>(false);
  const [countryId, setCountryId] = useState<string | null>(null);
  const [stateId, setStateId] = useState<string | null>(null);
  const [openStateId, setOpenStateId] = useState<boolean>(false);
  const [openCityId, setOpenCityId] = useState<boolean>(false);
  const [openBank1Id, setOpenBank1Id] = useState<boolean>(false);
  const [openBank2Id, setOpenBank2Id] = useState<boolean>(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const defaultValues: FormInputs = {
    agentName: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    countryId: "",
    stateId: "",
    cityId: "",
    pincode: "",
    isVehicle: false,
    isAirline: false,
    isTrain: false,
    contactPersonName: "",
    mobile1: "",
    mobile2: "",
    email1: "",
    email2: "",
    websiteName: "",
    panNumber: "",

    landlineNumber1: "",
    landlineNumber2: "",

    bank1Id: "",
    bankAccountNumber1: "",
    branch1: "",
    beneficiaryName1: "",
    ifscCode1: "",
    swiftCode1: "",

    bank2Id: null,
    bankAccountNumber2: "",
    branch2: "",
    beneficiaryName2: "",
    ifscCode2: "",
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
    mode: "onChange", // 👈 triggers validation on each change
    reValidateMode: "onChange", // 👈 re-validate on every change
  });

  const { data: editAgentData, isLoading: editAgentLoading } = useQuery({
    queryKey: ["editAgent", id],
    queryFn: async () => {
      const response = await get(`/agents/${id}`);
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

  const bankOptions = [
    { id: "none", bankName: "---" }, // The 'unselect' option
    ...(banks ?? []),
  ];

  // countries
  const { data: countries, isLoading: isCountriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await get(`/countries/all`);
      return response; // API returns the sector object directly
    },
  });
  const safeCountries = Array.isArray(countries) ? countries : [];

  const countryOptions = [
    { id: "none", countryName: "---" }, // The 'unselect' option
    ...(safeCountries ?? []),
  ];

  //  states
  const { data: states, isLoading: isStatesLoading } = useQuery({
    queryKey: ["states", countryId],
    queryFn: async () => {
      const response = await get(`/states/by-country/${countryId}`);
      return response; // API returns the sector object directly
    },
    enabled: !!countryId,
  });

  const stateOptions = [
    { id: "none", stateName: "---" }, // The 'unselect' option
    ...(states ?? []),
  ];

  //  cities
  const { data: cities, isLoading: isCitiesLoading } = useQuery({
    queryKey: ["hotelCities", stateId],
    queryFn: async () => {
      const response = await get(`/cities/by-state/${stateId}`);
      return response; // API returns the sector object directly
    },
    enabled: !!stateId,
  });

  const cityOptions = [
    { id: "none", cityName: "---" }, // The 'unselect' option
    ...(cities ?? []),
  ];

  useEffect(() => {
    if (editAgentData) {
      setCountryId(String(editAgentData.countryId) || "");
      setStateId(String(editAgentData.stateId) || "");

      reset({
        agentName: editAgentData.agentName ? editAgentData.agentName : "",
        addressLine1: editAgentData.addressLine1
          ? editAgentData.addressLine1
          : "",
        addressLine2: editAgentData.addressLine2
          ? editAgentData.addressLine2
          : "",
        addressLine3: editAgentData.addressLine3
          ? editAgentData.addressLine3
          : "",
        pincode: editAgentData.pincode ? editAgentData.pincode : "",

        contactPersonName: editAgentData.contactPersonName
          ? editAgentData.contactPersonName
          : "",
        mobile1: editAgentData.mobile1 ? editAgentData.mobile1 : "",
        mobile2: editAgentData.mobile2 ? editAgentData.mobile2 : "",

        email1: editAgentData.email1 ? editAgentData.email1 : "",
        email2: editAgentData.email2 ? editAgentData.email2 : "",

        websiteName: editAgentData.websiteName ? editAgentData.websiteName : "",

        panNumber: editAgentData.panNumber ? editAgentData.panNumber : "",

        landlineNumber1: editAgentData.landlineNumber1
          ? editAgentData.landlineNumber1
          : "",
        landlineNumber2: editAgentData.landlineNumber2
          ? editAgentData.landlineNumber2
          : "",

        bankAccountNumber1: editAgentData.bankAccountNumber1
          ? editAgentData.bankAccountNumber1
          : "",
        branch1: editAgentData.branch1 ? editAgentData.branch1 : "",
        beneficiaryName1: editAgentData.beneficiaryName1
          ? editAgentData.beneficiaryName1
          : "",
        ifscCode1: editAgentData.ifscCode1 ? editAgentData.ifscCode1 : "",
        swiftCode1: editAgentData.swiftCode1 ? editAgentData.swiftCode1 : "",

        bankAccountNumber2: editAgentData.bankAccountNumber2
          ? editAgentData.bankAccountNumber2
          : "",
        branch2: editAgentData.branch2 ? editAgentData.branch2 : "",
        beneficiaryName2: editAgentData.beneficiaryName2
          ? editAgentData.beneficiaryName2
          : "",
        ifscCode2: editAgentData.ifscCode2 ? editAgentData.ifscCode2 : "",
        swiftCode2: editAgentData.swiftCode2 ? editAgentData.swiftCode2 : "",

        bank1Id: editAgentData.bank1Id ? editAgentData.bank1Id : "",
        bank2Id: editAgentData.bank2Id ? editAgentData.bank2Id : null,

        countryId: editAgentData.countryId ? editAgentData.countryId : "",
        stateId: editAgentData.stateId ? editAgentData.stateId : "",
        cityId: editAgentData.cityId ? editAgentData.cityId : "",
        isAirline: editAgentData.isAirline,
        isVehicle: editAgentData.isVehicle,
        isTrain: editAgentData.isTrain,
      });
    }
  }, [editAgentData, reset]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post("/agents", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["agents"]); // Refetch the users list
      toast.success("Agent created successfully");
      navigate("/agents"); // Navigate to the hotels page after successful creation
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to create Agent");
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) => put(`/agents/${id}`, data),
    onSuccess: () => {
      toast.success("Agent updated successfully");
      queryClient.invalidateQueries(["agents"]);
      navigate("/agents"); // Navigate to the hotels page after successful update
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update Agent");
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

  return (
    <>
      {/* JSX Code for HotelForm.tsx */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10 min-w-5xl">
          <CardContent className="pt-6">
            {/* Hotel Details */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Agent Details
            </CardTitle>
            <div className="grid gap-4 mt-4">
              {/* Agent Name */}
              <div>
                <Label
                  htmlFor="agentName"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Agent Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="agentName"
                  {...register("agentName")}
                  placeholder="Enter agent name"
                />
                {errors.agentName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.agentName.message}
                  </p>
                )}
              </div>
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Address Details
              </h3>
              {/* Two Columns: Hotel Address Details and Office Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hotel Address Details */}

                <div>
                  <Label
                    htmlFor="addressLine1"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="addressLine1"
                    {...register("addressLine1")}
                    placeholder="Enter address line 1"
                  />
                  {errors.addressLine1 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.addressLine1.message}
                    </p>
                  )}
                </div>

                {/* countryId */}
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="countryId"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    country <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="countryId"
                    control={control}
                    render={({ field }) => (
                      <Popover
                        open={openCountryId}
                        onOpenChange={setOpenCountryId}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCountryId ? "true" : "false"} // This should depend on the popover state
                            className="w-[325px] md:w-[480px] justify-between overflow-hidden mt-1"
                            onClick={() => setOpenCountryId((prev) => !prev)} // Toggle popover on button click
                          >
                            {field.value
                              ? countryOptions &&
                                countryOptions.find(
                                  (country) => country.id === field.value
                                )?.countryName
                              : "Select country"}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[325px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search country..."
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup>
                                {countryOptions &&
                                  countryOptions.map((country) => (
                                    <CommandItem
                                      key={country.id}
                                      value={country.countryName.toLowerCase()} // 👈 Use client name for filtering
                                      onSelect={(currentValue) => {
                                        if (country.id === "none") {
                                          setValue("countryId", "");
                                          setCountryId("");
                                          setValue("stateId", "");
                                          setValue("cityId", "");
                                        } else {
                                          setValue("countryId", country.id);
                                          setCountryId(country.id);
                                          setValue("stateId", "");
                                          setValue("cityId", "");
                                        }

                                        setOpenCountryId(false);
                                        // Close popover after selection
                                      }}
                                    >
                                      {country.countryName}
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          country.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.countryId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.countryId.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="addressLine2"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Address Line 2
                  </Label>
                  <Input
                    id="addressLine2"
                    {...register("addressLine2")}
                    placeholder="Enter address line 3"
                  />
                  {errors.addressLine2 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.addressLine2.message}
                    </p>
                  )}
                </div>
                {/* state */}
                {/* stateId */}
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="stateId"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="stateId"
                    control={control}
                    render={({ field }) => (
                      <Popover open={openStateId} onOpenChange={setOpenStateId}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openStateId ? "true" : "false"} // This should depend on the popover state
                            className="w-[325px] md:w-[480px] justify-between overflow-hidden mt-1"
                            onClick={() => setOpenStateId((prev) => !prev)} // Toggle popover on button click
                          >
                            {field.value
                              ? stateOptions &&
                                stateOptions.find(
                                  (state) => state.id === field.value
                                )?.stateName
                              : "Select state"}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[325px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search state..."
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>No state found.</CommandEmpty>
                              <CommandGroup>
                                {stateOptions &&
                                  stateOptions.map((state) => (
                                    <CommandItem
                                      key={state.id}
                                      value={state.stateName.toLowerCase()} // 👈 Use client name for filtering
                                      onSelect={(currentValue) => {
                                        if (state.id === "none") {
                                          setValue("stateId", "");
                                          setStateId("");
                                          setValue("cityId", "");
                                        } else {
                                          setValue("stateId", state.id);
                                          setStateId(state.id);
                                          setValue("cityId", "");
                                        }

                                        setOpenStateId(false);
                                        // Close popover after selection
                                      }}
                                    >
                                      {state.stateName}
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          state.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.stateId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.stateId.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="addressLine3"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Address Line 3
                  </Label>
                  <Input
                    id="addressLine3"
                    {...register("addressLine3")}
                    placeholder="Enter address line 3"
                  />
                  {errors.addressLine3 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.addressLine3.message}
                    </p>
                  )}
                </div>
                {/* cityId */}
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="cityId"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="cityId"
                    control={control}
                    render={({ field }) => (
                      <Popover open={openCityId} onOpenChange={setOpenCityId}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCityId ? "true" : "false"} // This should depend on the popover state
                            className="w-[325px] md:w-[480px] justify-between overflow-hidden mt-1"
                            onClick={() => setOpenCityId((prev) => !prev)} // Toggle popover on button click
                          >
                            {field.value
                              ? cityOptions &&
                                cityOptions.find(
                                  (city) => city.id === field.value
                                )?.cityName
                              : "Select city"}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[325px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search city..."
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>No city found.</CommandEmpty>
                              <CommandGroup>
                                {cityOptions &&
                                  cityOptions.map((city) => (
                                    <CommandItem
                                      key={city.id}
                                      value={city.cityName.toLowerCase()} // 👈 Use client name for filtering
                                      onSelect={(currentValue) => {
                                        if (city.id === "none") {
                                          setValue("cityId", "");
                                        } else {
                                          setValue("cityId", city.id);
                                        }

                                        setOpenCityId(false);
                                        // Close popover after selection
                                      }}
                                    >
                                      {city.cityName}
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          city.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.cityId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.cityId.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="pincode"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Pincode <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pincode"
                    {...register("pincode")}
                    maxLength={6}
                    placeholder="Enter pincode"
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.pincode.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-around items-center">
                  <div className="mt-4 flex items-center space-x-2 ">
                    <Controller
                      name="isVehicle"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="isVehicle"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border border-2"
                        />
                      )}
                    />
                    <Label
                      htmlFor="isVehicle"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Vehicle
                    </Label>
                  </div>
                  <div className="mt-4 flex items-center space-x-2 ">
                    <Controller
                      name="isAirline"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="isAirline"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border border-2"
                        />
                      )}
                    />
                    <Label
                      htmlFor="isAirline"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Airline
                    </Label>
                  </div>
                  <div className="mt-4 flex items-center space-x-2 ">
                    <Controller
                      name="isTrain"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="isTrain"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border border-2"
                        />
                      )}
                    />
                    <Label
                      htmlFor="isTrain"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Train
                    </Label>
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
                  <div className="col-span-1 md:col-span-3">
                    <Label
                      htmlFor="contactPersonName"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Contact Person Name{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactPersonName"
                      {...register("contactPersonName")}
                      placeholder="Enter name"
                    />
                    {errors.contactPersonName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.contactPersonName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label
                      htmlFor="mobile1"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Contact No 1 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="mobile1"
                      {...register("mobile1")}
                      maxLength={10}
                      placeholder="Enter hotel contact no 1"
                    />
                    {errors.mobile1 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.mobile1.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="mobile2"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Contact No 2
                    </Label>
                    <Input
                      id="mobile2"
                      {...register("mobile2")}
                      maxLength={10}
                      placeholder="Enter hotel contact no 2"
                    />
                    {errors.mobile2 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.mobile2.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="landlineNumber1"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Landline No 1
                    </Label>
                    <Input
                      id="landlineNumber1"
                      {...register("landlineNumber1")}
                      maxLength={11}
                      placeholder="Enter office contact no 1"
                    />
                    {errors.landlineNumber1 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.landlineNumber1.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="landlineNumber2"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Landline No 2
                    </Label>
                    <Input
                      id="landlineNumber2"
                      {...register("landlineNumber2")}
                      maxLength={11}
                      placeholder="Enter office contact no 2"
                    />
                    {errors.landlineNumber2 && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.landlineNumber2.message}
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
                      Email 1 <span className="text-red-500">*</span>
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
                      htmlFor="websiteName"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Website
                    </Label>
                    <Input
                      id="website"
                      {...register("websiteName")}
                      placeholder="Enter website URL"
                    />
                    {errors.websiteName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.websiteName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="panNumber"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      PAN Number <span className="text-red-500">*</span>
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
                      <Popover open={openBank1Id} onOpenChange={setOpenBank1Id}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCityId ? "true" : "false"} // This should depend on the popover state
                            className="w-[325px] justify-between overflow-hidden mt-1"
                            onClick={() => setOpenBank1Id((prev) => !prev)} // Toggle popover on button click
                          >
                            {field.value
                              ? bankOptions &&
                                bankOptions.find(
                                  (bank) => bank.id === field.value
                                )?.bankName
                              : "Select bank"}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[325px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search bank..."
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>No bank found.</CommandEmpty>
                              <CommandGroup>
                                {bankOptions &&
                                  bankOptions.map((bank) => (
                                    <CommandItem
                                      key={bank.id}
                                      value={bank.bankName.toLowerCase()} // 👈 Use client name for filtering
                                      onSelect={(currentValue) => {
                                        if (bank.id === "none") {
                                          setValue("bank1Id", "");
                                        } else {
                                          setValue("bank1Id", bank.id);
                                        }

                                        setOpenBank1Id(false);
                                        // Close popover after selection
                                      }}
                                    >
                                      {bank.bankName}
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          bank.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                    htmlFor="ifscCode1"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    IFSC Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ifscCode1"
                    {...register("ifscCode1")}
                    placeholder="Enter IFSC code"
                  />
                  {errors.ifscCode1 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.ifscCode1.message}
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
                      <Popover open={openBank2Id} onOpenChange={setOpenBank2Id}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openBank2Id ? "true" : "false"} // This should depend on the popover state
                            className="w-[325px] justify-between overflow-hidden mt-1"
                            onClick={() => setOpenBank2Id((prev) => !prev)} // Toggle popover on button click
                          >
                            {field.value
                              ? bankOptions &&
                                bankOptions.find(
                                  (bank) => bank.id === field.value
                                )?.bankName
                              : "Select bank"}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[325px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search bank..."
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>No bank found.</CommandEmpty>
                              <CommandGroup>
                                {bankOptions &&
                                  bankOptions.map((bank) => (
                                    <CommandItem
                                      key={bank.id}
                                      value={bank.bankName.toLowerCase()} // 👈 Use client name for filtering
                                      onSelect={(currentValue) => {
                                        if (bank.id === "none") {
                                          setValue("bank2Id", null);
                                        } else {
                                          setValue("bank2Id", bank.id);
                                        }

                                        setOpenBank2Id(false);
                                        // Close popover after selection
                                      }}
                                    >
                                      {bank.bankName}
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          bank.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.bank2Id && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.bank2Id.message}
                    </p>
                  )}
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
                    htmlFor="ifscCode2"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    IFSC Code
                  </Label>
                  <Input
                    id="ifscCode2"
                    {...register("ifscCode2")}
                    placeholder="Enter IFSC code"
                  />
                  {errors.ifscCode2 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.ifscCode2.message}
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
              onClick={() => navigate("/agents")}
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

export default AgentForm;
