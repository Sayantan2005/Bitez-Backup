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
import { ClipLoader } from 'react-spinners';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';


function SignIn() {
    // const primaryColor = "#ff4d2d"
    // const hoverColor = "#e64323"
    // const bgColor = "#fff9f6"
    // const borderColor = "#ddd"
    const primaryColor = "#7c3aed"
    const hoverColor = "#6d28d9"
    const bgColor = "#f5f3ff"
    const borderColor = "#ddd6fe"


    const [showpassword, setShowPassword] = useState(false)
    const [loading,setLoading] = useState(false)


    const navigate = useNavigate()


    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const dispatch = useDispatch()

    // fetch Sign in controller

    const handleSignIn = async () => {
        setLoading(true)
        try {
            const res = await axios.post(`${serverUrl}/api/auth/signin`, {
                email, password
            }, { withCredentials: true })

            dispatch(setUserData(res.data.user))
            setLoading(false)
            toast.success(res.data.message)



        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || "Sign In Failed")
            setLoading(false)
        }
    }


    const handleGoogleAuth = async () => {


        // Create a Google authentication provider
        // This tells Firebase to use Google for sign-in
        const provider = new GoogleAuthProvider();



        try {
            // Open Google sign-in popup and authenticate the user
            // auth → Firebase auth instance
            // provider → GoogleAuthProvider instance
            const result = await signInWithPopup(auth, provider);
            const { data } = await axios.post(`${serverUrl}/api/auth/google-auth`, {

                email: result.user.email,

            }, { withCredentials: true })
            dispatch(setUserData(data))
            toast.success(data.message)
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || "Google Sign in Failed")
        }
    };



    return (
        <div className='min-h-screen w-full flex items-center justify-center p-4' style={{ backgroundColor: bgColor }}>
            <div className={`bg-white rounded-xl shadow-lg w-full max-w-md p-8 border`} style={{ border: `1px solid ${borderColor}` }}>
                <h1 className={`text-3xl font-bold mb-2`} style={{ color: `${primaryColor}` }}>Bitez</h1>
                <p className='text-gray-600 mb-8'>Sign in to Bitez and unlock a smarter way to eat delicious food with deliveries </p>


                {/* Email */}
                <div className='mb-4'>
                    <label htmlFor="email" className='block text-gray-700 font-medium mb-1'>Email</label>
                    <input type="email" className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500' placeholder='Enter your Email' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setEmail(e.target.value)} value={email} required />
                </div>

                {/* Password */}
                <div className='mb-4'>
                    <label htmlFor="password" className='block text-gray-700 font-medium mb-1'>Password</label>

                    <div className='relative'>
                        <input type={showpassword ? "text" : "password"} className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500' placeholder='Enter your Password' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setPassword(e.target.value)} value={password} required/>

                        <button onClick={() => { setShowPassword(!showpassword) }} className='absolute right-3 top-3 text-gray-500 cursor-pointer'>{showpassword ? <FaRegEyeSlash /> : <FaRegEye />}</button>
                    </div>

                </div>
                <div className='text-right mb-4 text-[#7c3aed] font-medium cursor-pointer' onClick={() => navigate("/forgot-password")}>
                    Forgot Password
                </div>



                <button className={`w-full font-semibold rounded-lg py-2 transition duration-200 bg-[#7c3aed] text-white hover:bg-[#9967e9] cursor-pointer`} onClick={handleSignIn} disabled={loading} >
                  {loading ? <ClipLoader size={20} /> : "Sign In"}
                </button>
                <button className='w-full mt-4 flex items-center justify-center gap-2 border rounded-lg px-4 py-2 transition duration-200 border-gray-400 hover:bg-gray-100 cursor-pointer' onClick={handleGoogleAuth}>
                    <FcGoogle size={20} />
                    <span>Sign in with Google</span>
                </button>
                <p className='text-center mt-3 cursor-pointer'>Want to create a new Account ? <span className='text-[#7c3aed] ' onClick={() => navigate("/signup")}>Sign Up</span></p>
            </div>



        </div>
    )
}

export default SignIn