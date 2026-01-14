import jwt from "jsonwebtoken";

const Verifytoken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded:",decoded);
    
    
    req.user = decoded;

    console.log("req.user:",req.user);
    next()
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default Verifytoken;

