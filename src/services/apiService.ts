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
  console.log("Request Interceptor triggered. Token:", token); // Log the token value
  console.log("Request Interceptor triggered. Refresh Token:", refreshToken); // Log the refresh token value
  if (refreshToken) {
    config.headers["x-refresh-token"] = refreshToken;
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log("Response Interceptor triggered. Error:", error); // Log the entire error object

    if (error.response) {
      // Check if error.response exists
      console.log("Error Response Status:", error.response.status);
      console.log("Error Response Headers:", error.response.headers);

      let tokenExpiredHeader = null;
      if (error.response.headers) {
        // Check if error.response.headers exists before accessing
        tokenExpiredHeader = error.response.headers["token-expired"];
      }
      console.log("Token-Expired Header Value:", tokenExpiredHeader);

      if (
        error.response.status === 401 &&
        tokenExpiredHeader === "true" // Use the logged variable here
      ) {
        console.log("Token expired detected (inside condition)!");
        const refreshToken = localStorage.getItem("refreshToken");
        console.log("Refresh Token from localStorage:", refreshToken); // Log refresh token value

        if (refreshToken) {
          console.log("Refresh token found, attempting refresh...");
          try {
            const refreshResponse = await axios.post("/auth/refresh", {
              refreshToken,
            });
            console.log("Refresh successful!", refreshResponse.data);
            const newAccessToken = refreshResponse.data.accessToken;
            console.log("New access token received:", newAccessToken);
            localStorage.setItem("authToken", newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
          }
        } else {
          console.log("No refresh token found.");
        }
      }
    } else {
      console.log("No error.response object found in error.");
    }

    return Promise.reject(error);
  }
);

export const get = async (url: string, params?: any, config?: any) => {
  try {
    const finalConfig = {
      params,
      ...config,
    };

    const response = await api.get(url, { withCredentials: true });

    if (config?.responseType === "blob") {
      return response;
    }

    return response.data;
  } catch (error: any) {
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
