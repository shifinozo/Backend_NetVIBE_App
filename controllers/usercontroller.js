
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userModel } from "../Models/UserModel.js";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    


    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });

    
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



// --------------------------------------------------------------------------



export const loginUser = async (req, res) => {
  try {
    const { email, username, password, googleId } = req.body;
    // google login
    if (googleId) {
      const user = await userModel.findOne({ email });

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      if (user.googleId !== googleId) {
        return res.status(401).json({
          message: "Invalid Google login"
        });
      }

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Google login successful",
        token,
        user
      });
    }

  //  normal login
    const user = await userModel.findOne({
      $or: [{ email }, { username }]
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Please login using Google"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
};


// ----------------------------------------------------------

