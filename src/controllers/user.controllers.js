import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";


const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;
    console.log('fullName:', fullName);
    console.log('email:', email);
    console.log('username:', username);
    console.log('password:', password);


    if (
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "Please provide all required fields");
    }

    
});
// const loginUser = asyncHandler(async (req, res) => {
//     res.status(200).json({ message: "ok" });
//     //const { email, password } = req.body;
// });

export { registerUser };