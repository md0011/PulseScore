import { ethers, JsonRpcSigner } from "ethers";
import React, { useState, useEffect } from "react";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { CONTRACT_ABI } from "../abi";
import Typography from "@mui/material/Typography";
import Rating from "@mui/material/Rating";
import { QRCodeSVG } from "qrcode.react";

type Props = { wallet: JsonRpcSigner };

function PulseScoreApp(p: Props) {
  const address = "0x3DbDd3A45D68C0C60FdA2f4eb79809409ED15388";
  const contract = new ethers.Contract(address, CONTRACT_ABI, p.wallet);

  const [userAddress, setUserAddress] = useState<string>("");
  const [userRating, setUserRating] = useState<number>(0);
  const [scannedAddress, setScannedAddress] = useState<string | null>(null);
  const [scannedUserRating, setScannedUserRating] = useState<number>(0);
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(true);

  // Fetch user's rating details on mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      const userAddr = await p.wallet.getAddress();
      setUserAddress(userAddr);

      try {
        const avgRating = await contract.getAverageRating(userAddr);
        setUserRating(Number(avgRating));
      } catch (err) {
        console.error("Error fetching rating", err);
        setUserRating(0); // If no ratings exist, default to 0
      }
    };
    fetchUserDetails();
  }, [p.wallet, contract]);

  // Handle QR code scan
  const handleScan = async (result: IDetectedBarcode[]) => {
    if (result) {
      setScannedAddress(result[0].rawValue);
      setShowScanner(false); // Hide scanner after scan
      try {
        const avgRating = await contract.getAverageRating(result[0].rawValue);
        setScannedUserRating(Number(avgRating));
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
      <section className="text-gray-400 h-screen flex items-center bg-gray-900 body-font">
        <div className="container px-5 py-24 mx-auto">
          <div className="flex flex-wrap -mx-4 -mb-10">
            <div className="sm:w-1/2 mb-10 px-4">
              {/* QR Scanner */}
              <div className="mb-6 max-w-md mx-auto rounded-xl shadow-md">
                {showScanner && (
                  <>
                    <Scanner onScan={handleScan} />
                    <h2 className="title-font text-2xl font-medium text-white my-6 text-center">
                      Scan QR Code
                    </h2>
                  </>
                )}
              </div>

              {/* Scanned user details */}
              {scannedAddress && (
                <>
                  <div className="p-6 mx-auto bg-gray-100 text-black rounded-xl shadow-md title-font">
                    <div className="text-black">
                      <div className=" text-2xl font-medium mb-2">
                        Scanned User Details
                      </div>
                      <hr className="border-gray-400" />
                      <div className="text-lg mt-5 text-orange-600 font-bold">
                        Address:  <span className="text-gray-900 font-normal">{scannedAddress}</span>
                      </div>
                      <div className="text-lg my-5 text-orange-600 font-bold">
                        Average Rating: <span className="text-gray-900 font-normal">{scannedUserRating / 5}</span>
                      </div>
                    </div>
                    <hr className="border-gray-400" />
                    {/* Rating input for scanned user */}
                    <div className="text-lg font-semibold mt-5">
                      Tap a star to rate it:
                    </div>
                    <Rating
                      name="simple-controlled"
                      value={ratingValue}
                      onChange={(event, newValue) => setRatingValue(newValue)}
                    /> <br />
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                      onClick={handleRating}
                    >
                      Submit Rating
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="sm:w-1/2 mb-10 px-4 text-right">
              <div className="title-font text-2xl font-medium text-white my-5">
                My Profile
              </div>
              <hr className="border-gray-500"/>
              <div className="text-xl mt-5 text-green-600 font-bold">Address: <span className="text-gray-400 font-normal"> {p.wallet.address} </span></div>
              <div className="text-xl mt-5 text-green-600 font-bold">
                Average Rating: <span className="text-gray-400 font-normal">{userRating / 5}</span>
              </div>
              <div className="mt-14 float-right">
                <QRCodeSVG
                  value={p.wallet.address}
                  size={200}
                  className="p-4 bg-white rounded shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default PulseScoreApp;
