import axios from "axios";
import { backendUrl } from "../config";
import { useEffect } from "react";

const api = axios.create({
  baseURL: backendUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  const refreshToken = localStorage.getItem("refreshToken");
  // console.log("Request Interceptor triggered. Token:", token); // Log the token value
  // console.log("Request Interceptor triggered. Refresh Token:", refreshToken); // Log the refresh token value
  if (refreshToken) {
    config.headers["x-refresh-token"] = refreshToken;
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // console.log("Jbdfusdfubsdf");
  return config;
});

export const get = async (url: string, params?: any, config?: any) => {
  try {
    const finalConfig = {
      params,
      ...config,
    };

    const response = await api.get(url, { withCredentials: true });

    // if (config?.responseType === "blob") {
    //   return response;
    // }

    return response.data;
  } catch (error: any) {
    console.log("sdasd");
    throw {
      status: error.response?.status,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};

export const post = async (url: string, data: any) => {
  try {
    const response = await api.post(url, data, { withCredentials: true });
    return response.data;
  } catch (error: any) {
    throw {
      status: error.response?.status,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};

export const put = async (url: string, data: any) => {
  try {
    const response = await api.put(url, data);
    return response.data;
  } catch (error: any) {
    throw {
      status: error.response?.status,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};

export const patch = async (url: string, data: any) => {
  try {
    const response = await api.patch(url, data);
    return response.data;
  } catch (error: any) {
    throw {
      status: error.response?.status,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};

export const del = async (url: string) => {
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error: any) {
    throw {
      status: error.response?.status,
      message: error.response?.data?.errors?.message || "Request failed",
    };
  }
};
