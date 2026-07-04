import multer from "multer";

const fileFilter = (req, file, cb) => {
  if (!file) {
    return cb(null, true);
  }

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpg, png, webp, gif) or videos (mp4, webm, mov) are allowed"), false);
  }
};

const storage = multer.memoryStorage();

const chatUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

export default chatUpload;
