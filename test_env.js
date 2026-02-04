import dotenv from "dotenv";
const result = dotenv.config();
if (result.error) {
    console.error("Dotenv error:", result.error);
} else {
    console.log("Dotenv success. Parsed keys:", Object.keys(result.parsed));
}
