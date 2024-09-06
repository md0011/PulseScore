import { ethers, JsonRpcSigner } from "ethers";
import React, { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CONTRACT_ABI } from "../abi";
import Typography from '@mui/material/Typography';
import Rating from '@mui/material/Rating';

type Props = { wallet: JsonRpcSigner };

function PulseScoreApp(p: Props) {
  const address = "0x3DbDd3A45D68C0C60FdA2f4eb79809409ED15388";
  const contract = new ethers.Contract(address, CONTRACT_ABI, p.wallet);

  const [userAddress, setUserAddress] = useState<string>("");
  const [userRating, setUserRating] = useState<number>(0);
  const [scannedAddress, setScannedAddress] = useState<string | null>(null);
  const [scannedUserRating, setScannedUserRating] = useState<number>(0);
  const [ratingValue, setRatingValue] = useState<number | null>(null);

  // Fetch user's rating details on mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      const userAddr = await p.wallet.getAddress();
      setUserAddress(userAddr);

      try {
        const avgRating = await contract.getAverageRating(userAddr);
        setUserRating(avgRating.toNumber());
      } catch (err) {
        console.error("Error fetching rating", err);
        setUserRating(0); // If no ratings exist, default to 0
      }
    };
    fetchUserDetails();
  }, [p.wallet, contract]);

  // Handle QR code scan
  const handleScan = async (result: string | null) => {
    if (result) {
      setScannedAddress(result);

      try {
        const avgRating = await contract.getAverageRating(result);
        setScannedUserRating(avgRating.toNumber());
      } catch (err) {
        console.error("Error fetching scanned user's rating", err);
        setScannedUserRating(0); // If no ratings exist, default to 0
      }
    }
  };

  // Handle rating submission
  const handleRating = async () => {
    if (scannedAddress && ratingValue) {
      try {
        await contract.rateUser(scannedAddress, ratingValue);
        alert("Rating submitted successfully!");
      } catch (err) {
        console.error("Error submitting rating", err);
        alert("Failed to submit rating");
      }
    }
  };

  return (
    <>
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-4">PulseScore</h1>

        {/* Display user's rating */}
        <div className="mb-6">
          <Typography component="legend">Your Average Rating:</Typography>
          <div className="text-xl">{userRating}/5</div>
        </div>

        {/* QR Scanner */}
        <div className="mb-6">
          <Scanner onScan={handleScan} />
        </div>

        {/* Scanned user details */}
        {scannedAddress && (
          <>
            <div className="mb-6">
              <Typography component="legend">Scanned User Address:</Typography>
              <div className="text-sm break-words">{scannedAddress}</div>
              <Typography component="legend">Scanned User Rating:</Typography>
              <div className="text-xl">{scannedUserRating}/5</div>
            </div>

            {/* Rating input for scanned user */}
            <Typography component="legend">Rate Scanned User</Typography>
            <Rating
              name="simple-controlled"
              value={ratingValue}
              onChange={(event, newValue) => setRatingValue(newValue)}
            />
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleRating}
            >
              Submit Rating
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default PulseScoreApp;
