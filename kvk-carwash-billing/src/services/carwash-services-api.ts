import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const CAR_API_URL = `${API_URL}car-service/wash-service/`;

const getToken = () => {
  const cashier = localStorage.getItem("cashier")
    ? JSON.parse(localStorage.getItem("cashier") as string)
    : null;

  return cashier ? cashier.token : null;
};

export const getCarServices = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${CAR_API_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};