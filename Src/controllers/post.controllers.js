import postModels from "../models/post.models.js";
import userModels from "../models/user.models.js";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config(); // Load  hon raha ha environment variables

// Cloudinary  configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Upload image to Cloudinary
const uploadImageToCloudinary = async (filename) => {
  try {
    const uploadResult = await cloudinary.uploader.upload_stream(
      { resource_type: "image", public_id: filename },
      (error, result) => {
        if (error) throw error;
        return result;
      }
    );
    return uploadResult.url; // Return the image URL
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

// Get all posts
export const getAllPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;
  const skip = (page - 1) * limit;

  try {
    const posts = await postModels.find().skip(skip).limit(limit);
    const totalPosts = await postModels.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts,
      totalPages,
      currentPage: page,
      totalPosts,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get post by ID
export const getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await postModels.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

// Create a new post
export const createPost = async (req, res) => {
  const { name, description, price, category, stock, authorId } = req.body;

  if (!name || !description || !price || !authorId) {
    return res.status(400).json({ message: "All fields are required." });
  }

  let imageURl;
  if (!req.file) {
    return res.status(400).json({ message: "No image file uploaded." });
  } else {
    try {
      const uploadResult = await uploadImageToCloudinary(req.file.path);
      if (!uploadResult) {
        return res.status(500).json({ message: "Error uploading image." });
      }
      imageURl = uploadResult;
    } catch (error) {
      return res.status(500).json({ message: "Error uploading image.", error });
    }
  }

  try {
    // const User = await userModels.findById(autorId);
    // if (!User) {
    //   return res.status(404).json({ message: "User not found." });
    // }

    const post = await postModels.create({
      name,
      description,
      price,
      category,
      stock,
      images: imageURl,
      authorId,
    });

    // User.posts.push(post);
    // await User.save();

    res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

// Edit a post
export const editPost = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, stock, images } = req.body;

  try {
    const updatedPost = await postModels.findByIdAndUpdate(
      id,
      { name, description, price, category, stock, images },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found." });
    }

    res
      .status(200)
      .json({ message: "Post updated successfully", post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await postModels.findByIdAndDelete(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    res.status(200).json({ message: "Post deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};
