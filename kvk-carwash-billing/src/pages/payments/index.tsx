import { getAllCarPackages } from "@/services/carwash-packages-api";
import { useEffect } from "react";

export default function Payments() {

  const getAllPackages = async () => {
    try {
      const res = await getAllCarPackages();
      console.log("All Packages:", res);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  }

  useEffect(() => {
    getAllPackages();
  }, []);

  return (
    <></>
  );
}
