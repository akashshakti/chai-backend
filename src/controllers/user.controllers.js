import {asyncHandler} from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({ message: "ok" });
    //const { username, email, password } = req.body;
});

// const loginUser = asyncHandler(async (req, res) => {
//     res.status(200).json({ message: "ok" });
//     //const { email, password } = req.body;
// });

export { registerUser };