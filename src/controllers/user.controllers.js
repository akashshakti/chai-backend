import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshTokens = async (userId) => {
       try {
          const user = await User.findById(userId);
          const accessToken = await user.generateAccessToken();
          const refreshToken = await user.generateRefreshToken();

          user.refreshToken = refreshToken;
          await user.save({ validateBeforeSave: false });

          return { accessToken, refreshToken };

        }
       catch (error) {
            throw new ApiError(500, "Error while generating access and refresh tokens");
        }
};

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

const loginUser = asyncHandler(async (req, res) => {
    //req body sa data laoo
    // use the data to find the user in the database (used email or username)
    // find the user in the database
    // if user not found, return error
    // if user found, compare the password with the hashed password in the database
    // if password match, generate a token and return it to the user
    // if password does not match, return error
    // access token and refresh token generate karna hai
    // send the access token and refresh token to the user
    // send cookie to the user with the refresh token


    const { email,username, password } = req.body;

    if (!username || !email || !password) {
        throw new ApiError(400, "Please provide username, email, or password");
    }


    // User.findOne({ $or: [{ email }, { username }] })
    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }


    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // const { accessToken, refreshToken } = await user.generateAccessAndRefreshTokens();

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200, "User logged in successfully", 
        { 
            user: loggedInUser, accessToken, refreshToken 
        }
    ));


});



const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, 
        { 
            $set: { 
                refreshToken: undefined 
            } 
        }, 
        { 
            new: true 
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));

});



export { registerUser, loginUser, logoutUser };