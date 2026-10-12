import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser = asyncHandler(async (req, res) => {


    const { fullName, email, username, password } = req.body;
    // console.log('fullName:', fullName);
    // console.log('email:', email);
    // console.log('username:', username);
    // console.log('password:', password);


    if (
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "Please provide all required fields");
    }

    const existedUser = await User.findOne({ $or: [ { username }, { email } ] });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0]?.path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath, `avatars/${username}`);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }

    return res.status(201).json(new ApiResponse(201, "User created successfully", createdUser));

})

// const loginUser = asyncHandler(async (req, res) => {
//     res.status(200).json({ message: "ok" });
//     //const { email, password } = req.body;
// });

export { registerUser };