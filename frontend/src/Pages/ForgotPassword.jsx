import axios from 'axios';
import React, { useState } from 'react'
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import { toast } from 'sonner';
import { ClipLoader } from 'react-spinners';




function ForgotPassword() {
  // step is used to control which part (screen) of the forgot password process is shown
  // step = 1 → Email input screen
  // step = 2 → OTP verification screen
  // step = 3 → Reset password screen
  // We change step using setStep() to move the user to the next stage


  const [step, setStep] = useState(1)

  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading,setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSendOtp = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${serverUrl}/api/auth/send-otp`, { email }, { withCredentials: true })
      console.log(res)
      setStep(2)
      toast.success(res.data.message)
      setLoading(false)

    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || "Something went wrong")
         setLoading(false)

    }
  }

  const handleVerifyOtp = async () => {
       setLoading(true)
    try {
      const res = await axios.post(`${serverUrl}/api/auth/verify-otp`, { email, otp }, { withCredentials: true })
      console.log(res)
      setStep(3)
      toast.success(res.data.message)
         setLoading(false)

    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || "Something went wrong")
         setLoading(false)

    }
  }

  const handleResetPassword = async () => {
    if (newPassword != confirmPassword) {
      toast.error("Passwords do not match")
      return

    }
       setLoading(true)
    try {

      const res = await axios.post(`${serverUrl}/api/auth/reset-password`, { email, newPassword }, { withCredentials: true })
      console.log(res)
      navigate("/signin")
      toast.success(res.data.message)
         setLoading(false)

    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || "Something went wrong")
         setLoading(false)
    }
  }

  return (
    <div className='flex items-center w-full justify-center min-h-screen p-4 bg-[#edebf7]'>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8'>

        <div className='flex items-center gap-4 mb-4'>
          <IoMdArrowRoundBack size={25} className='text-[#7c3aed] cursor-pointer' onClick={() => navigate('/signin')} />
          <h1 className='text-2xl font-bold text-center text-[#7c3aed]'>Forgot Password</h1>
        </div>

        {/*Enter email  */}
        {step == 1
          &&
          <div>
            <div className='mb-6'>
              <label htmlFor="email" className='block text-gray-700 font-medium mb-1'>Email</label>

              <input type="email" className='w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none ' placeholder='Enter your Email' onChange={(e) => setEmail(e.target.value)} value={email} required />
            </div>
            <button className={`w-full font-semibold rounded-lg py-2 transition duration-200 bg-[#7c3aed] text-white hover:bg-[#9967e9] cursor-pointer`} onClick={handleSendOtp} disabled={loading} >
              {loading ? <ClipLoader size={20} /> : "Send OTP"}
            </button>
          </div>

        }

        {/* Enter Otp */}
        {step == 2
          &&
          <div>
            <div className='mb-6'>
              <label htmlFor="otp" className='block text-gray-700 font-medium mb-1'>Enter Otp</label>

              <input type="email" className='w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none ' placeholder='OTP' onChange={(e) => setOtp(e.target.value)} value={otp} required/>
            </div>
            <button className={`w-full font-semibold rounded-lg py-2 transition duration-200 bg-[#7c3aed] text-white hover:bg-[#9967e9] cursor-pointer`} onClick={handleVerifyOtp} disabled={loading} >
             {loading ? <ClipLoader size={20} /> : "Verify"}
            </button>
          </div>

        }

        {/* Enter  */}
        {step == 3
          &&
          <div>
            <div className='mb-6'>
              <label htmlFor="newPassword" className='block text-gray-700 font-medium mb-1'>New Passsword</label>

              <input type="email" className='w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none ' placeholder='Enter new Password' onChange={(e) => setNewPassword(e.target.value)} value={newPassword} required/>
            </div>
            <div className='mb-6'>
              <label htmlFor="confirmPassword" className='block text-gray-700 font-medium mb-1'>Confirm Passsword</label>

              <input type="email" className='w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none ' placeholder='Confirm Password' onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} required/>
            </div>
            <button className={`w-full font-semibold rounded-lg py-2 transition duration-200 bg-[#7c3aed] text-white hover:bg-[#9967e9] cursor-pointer`} onClick={handleResetPassword} disabled={loading} >
             {loading ? <ClipLoader size={20} /> : "Reset Password"}
            </button>
          </div>

        }

      </div>
    </div>
  )
}

export default ForgotPassword