import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from '../utils/apiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {apiResponse} from '../utils/apiResponse.js'

const registerUser = asyncHandler( async (req, res) => {
    const {username, email, password, fullname} = req.body
    
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new apiError(400, "All fields are requird") 
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    
    if(existedUser){
        throw new apiError(409, "User with username or email already exists!!")
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverPageLocalPath = req.files?.coverPage[0]?.path;
    
    if(!avatarLocalPath){
        throw new apiError(400, "Avatar file is required")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverPageLocalPath)
    
    if(!avatar){
        throw new apiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new apiError(500, "Something wetn wrong while registering the user")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered Successfully")
    )

})




export {registerUser}