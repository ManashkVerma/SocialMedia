import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from '../utils/apiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {apiResponse} from '../utils/apiResponse.js'

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        
    } catch (error) {
        throw new apiError(500, "Someting went wrong while generating refresh and access token")
    }

    return {accessToken, refreshToken}
}

const registerUser = asyncHandler( async (req, res) => {
    const {username, email, password, fullname} = req.body
    
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new apiError(400, "All fields are requird") 
    }


    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    
    if(existedUser){
        throw new apiError(409, "User with username or email already exists!!")
    }
    
    const avatarFile = req.files?.avatar?.[0];
    const coverPageFile = req.files?.coverPage?.[0];

    const avatarLocalPath = avatarFile?.path;
    const coverPageLocalPath = coverPageFile?.path || null;

    if(!avatarLocalPath){
        throw new apiError(400, "Avatar file is required")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverPageLocalPath)
    
    if(!avatar){
        throw new apiError(400, "Avatar file upload fail")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    if (!user || !user._id) {
        throw new apiError(500, "User creation failed");
    }

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new apiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asyncHandler( async (req, res) => {

    const {username, email, password} = req.body

    if(!username || !email){
        throw new apiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new apiError(404, "User does not exist")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new apiError(401, "Invalid password credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(_id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
        new apiResponse(200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User LoggedIn Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) => {
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
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "user logged out"))
})


export {registerUser, loginUser, logoutUser}