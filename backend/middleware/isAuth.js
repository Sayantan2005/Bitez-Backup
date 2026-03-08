// Authetication middleware --> access the token which stored in cookies and find the user id and using this id return the current user
import jwt, { decode } from "jsonwebtoken"

const isAuth = (req, res, next) => {
  try {
    

    const token =
      req.cookies.token

      

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

    if(!decodedToken){
        return res.status(400).json({
            message:"token not verify"
        })
    }
    
    // console.log(decodedToken)
    req.userId = decodedToken.userId
    next()

  } catch (error) {
    console.error("isAuth error:", error.message)
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    })
  }
}
export default isAuth