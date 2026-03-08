import React from 'react'
import { useState } from 'react'
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom"
import axios from 'axios';
import { serverUrl } from '../App';
import { toast } from 'sonner';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { ClipLoader } from "react-spinners"
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';


function SignUp() {
    // const primaryColor = "#ff4d2d"
    // const hoverColor = "#e64323"
    // const bgColor = "#fff9f6"
    // const borderColor = "#ddd"
    const primaryColor = "#7c3aed"
    const hoverColor = "#6d28d9"
    const bgColor = "#f5f3ff"
    const borderColor = "#ddd6fe"


    const [showpassword, setShowPassword] = useState(false)
    const [role, setRole] = useState("user")
    const [loading,setLoading] = useState(false)

    const navigate = useNavigate()

    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [mobile, setMobile] = useState("")

    const dispatch = useDispatch()

    // fetch Sign Up controller

    const handleSignUp = async () => {
        setLoading(true)
        try {
            const res = await axios.post(`${serverUrl}/api/auth/signup`, {
                fullName, email, password, mobile, role
            }, { withCredentials: true })

            dispatch(setUserData(res.data.user))
            setLoading(false)
            navigate("/signin") //after navigate move to sign in page 
            toast.success(res.data.message)
            
           

        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || "Sign Up Failed" )
            setLoading(false)
        }
    }

    // handle google authentication
    // Function to handle Google authentication
    const handleGoogleAuth = async () => {

        // Check if mobile number is provided or not
        // If mobile is empty or undefined, stop execution
        if (!mobile) {
            toast.error("Mobile no is required")
            return;
        }

        // Create a Google authentication provider
        // This tells Firebase to use Google for sign-in
        const provider = new GoogleAuthProvider();

       

        try {
             // Open Google sign-in popup and authenticate the user
        // auth → Firebase auth instance
        // provider → GoogleAuthProvider instance
        const result = await signInWithPopup(auth, provider);
            const {data} = await axios.post(`${serverUrl}/api/auth/google-auth`,{
                fullName:result.user.displayName,
                email: result.user.email,
                role,
                mobile
            },{withCredentials:true})
            dispatch(setUserData(data))
            toast.success(data.message)
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || "Google Sign Up Failed" )

        }
    };





    return (
        <div className='min-h-screen w-full flex items-center justify-center p-4' style={{ backgroundColor: bgColor }}>
            <div className={`bg-white rounded-xl shadow-lg w-full max-w-md p-8 border`} style={{ border: `1px solid ${borderColor}` }}>
                <h1 className={`text-3xl font-bold mb-2`} style={{ color: `${primaryColor}` }}>Bitez</h1>
                <p className='text-gray-600 mb-8'>Sign up to Bitez and unlock a smarter way to eat. your next meal is just a few clicks away. </p>

                {/* fullName */}
                <div className='mb-4'>
                    <label htmlFor="fullName" className='block text-gray-700 font-medium mb-1'>Full Name</label>
                    <input type="text" className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500' placeholder='Enter your Full Name' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setFullName(e.target.value)} value={fullName} required />
                </div>
                {/* Email */}
                <div className='mb-4'>
                    <label htmlFor="email" className='block text-gray-700 font-medium mb-1'>Email</label>
                    <input type="email" className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500' placeholder='Enter your Email' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setEmail(e.target.value)} value={email} required />
                </div>
                {/* mobile */}
                <div className='mb-4'>
                    <label htmlFor="mobile" className='block text-gray-700 font-medium mb-1'>Mobile</label>
                    <input type="number" className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500' placeholder='Enter your Mobile Number' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setMobile(e.target.value)} value={mobile} required />
                </div>

                {/* Password */}
                <div className='mb-4'>
                    <label htmlFor="password" className='block text-gray-700 font-medium mb-1'>Password</label>

                    <div className='relative'>
                        <input type={showpassword ? "text" : "password"} className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500' placeholder='Enter your Password' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setPassword(e.target.value)} value={password} required/>

                        <button onClick={() => { setShowPassword(!showpassword) }} className='absolute right-3 top-3 text-gray-500 cursor-pointer'>{showpassword ? <FaRegEyeSlash /> : <FaRegEye />}</button>
                    </div>

                </div>

                {/* Role */}
                <div className='mb-4'>
                    <label htmlFor="role" className='block text-gray-700 font-medium mb-1'>Role</label>

                    <div className='flex gap-2'>
                        {["user", "owner", "deliveryBoy"].map((r) => (

                            <button
                                key={r}
                                className='flex-1 border rounded-lg px-3 py-2 text-center font-medium transition-colors'
                                onClick={() => setRole(r)}
                                style={
                                    role == r ? { backgroundColor: primaryColor, color: "white" } : { border: `1px solid ${primaryColor}`, color: primaryColor }
                                }>{r}</button>
                        ))}
                    </div>

                </div>
                <button className={`w-full font-semibold rounded-lg py-2 transition duration-200 bg-[#7c3aed] text-white hover:bg-[#9967e9] cursor-pointer`} onClick={handleSignUp} disabled={loading}>
                    {loading ? <ClipLoader size={20} /> : "Sign Up"}
                   
                </button>
                <button className='w-full mt-4 flex items-center justify-center gap-2 border rounded-lg px-4 py-2 transition duration-200 border-gray-400 hover:bg-gray-100 cursor-pointer' onClick={handleGoogleAuth}>
                    <FcGoogle size={20} />
                    <span>Sign up with Google</span>
                </button>
                <p className='text-center mt-3 cursor-pointer'>Already have an account ? <span className='text-[#7c3aed] ' onClick={() => navigate("/signin")}>Sign In</span></p>
            </div>



        </div>
    )
}

export default SignUp