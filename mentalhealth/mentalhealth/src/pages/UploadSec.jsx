import React, { useState } from "react";

const UploadSec = ({ onPostUpload }) => {
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please drop a valid image file (e.g., .jpg, .png).");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image is too large. Please use an image smaller than 2MB.");
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => {
    setError(null);
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select a valid image file (e.g., .jpg, .png).");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image is too large. Please use an image smaller than 2MB.");
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAnonymousToggle = (e) => {
    setIsAnonymous(e.target.checked);
    if (e.target.checked) {
      setName("");
      setLocation("");
    }
  };

  const handlePost = async () => {
    if (!caption.trim()) {
      setError("Caption is required.");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      let imagePath = null;
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        const uploadResponse = await fetch("http://localhost:3000/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) throw new Error("Failed to upload image");
        const uploadResult = await uploadResponse.json();
        imagePath = uploadResult.imagePath;
      }

      const postData = {
        caption,
        ...(isAnonymous ? {} : { name: name.trim(), location: location.trim() }),
      };
      const postResponse = await fetch("http://localhost:3000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      if (!postResponse.ok) throw new Error("Failed to create post");

      const newPost = await postResponse.json();
      onPostUpload({ ...newPost, imagePath });
      setSelectedImage(null);
      setImagePreview(null);
      setCaption("");
      setName("");
      setLocation("");
      setIsAnonymous(false);
    } catch {
      setError("Failed to upload post. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full my-48 p-4">
                        <div className="flex flex-col items-center mb-24 gap-2 md:gap-4 px-4">
        <h2 className="font-['General_Sans'] font-semibold text-dark-blue900 text-2xl md:text-5xl text-center">
          Share Your Thoughts and Feelings
        </h2>
        <p className="font-[Satoshi] font-normal text-dark-blue900 text-lg md:text-2xl text-center">
          A place to share your thoughts and feelings. So let’s try fast enough to fit anywhere.
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md border border-purple-200">
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <p className="text-gray-600 mb-4">
          You can post anonymously by leaving name and location blank or checking
          "Post Anonymously".
        </p>
        <div
          className={`border-2 border-dashed p-6 rounded-md mb-4 ${
            dragActive ? "border-blue-600 bg-blue-50" : "border-gray-300"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <p className="text-gray-600 text-center">
            Drag & Drop an Image Here or{" "}
            <label
              htmlFor="fileInput"
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Browse
            </label>
          </p>
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-32 object-cover rounded-md mt-4"
            />
          )}
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption..."
          className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
          rows="4"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
          disabled={isAnonymous}
        />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Your location (optional)"
          className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
          disabled={isAnonymous}
        />
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={handleAnonymousToggle}
            className="mr-2"
          />
          <span className="text-gray-600">Post Anonymously</span>
        </label>
        <button
          onClick={handlePost}
          disabled={isUploading}
          className={`w-full py-2 rounded-md text-white ${
            isUploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isUploading ? "Uploading..." : "Post"}
        </button>
        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full animate-pulse"
                style={{ width: "50%" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadSec;