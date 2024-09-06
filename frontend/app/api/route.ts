import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

export function GET() {
  // Read the private key from the PEM file
  const privateKeyPath = path.join(__dirname, "private_key.pem");
  const privateKey = fs.readFileSync("private_key.pem", "utf8");

  // Payload data for the JWT
  const payload = {

  };

  // Sign the JWT with RS256 algorithm 
  const token = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "1h", // Token expiration time
  });

  console.log("Generated JWT:", token);
}
