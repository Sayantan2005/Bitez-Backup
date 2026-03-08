import React, { useState } from 'react'
import { IoMdArrowBack } from "react-icons/io";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUtensils } from "react-icons/fa";
import { serverUrl } from '../App';
import { setMyShopData } from '../redux/ownerSlice';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import { toast } from 'sonner';


function CreateEditShop() {
  const navigate = useNavigate()

  const { myShopData } = useSelector(state => state.owner)

  const { currentCity, currentState, currentAddress } = useSelector(state => state.user)

  const [name, setName] = useState(myShopData?.name || "")

  // show the state and city of the shop otherwise show the city and state of current user so update the userSlice 
  const [state, setState] = useState(myShopData?.state || currentState)
  const [city, setCity] = useState(myShopData?.city || currentCity)
  const [address, setAddress] = useState(myShopData?.address || currentAddress)

  const [loading , setLoading] = useState(false) 

  const dispatch = useDispatch()

  // forntend image --> jo bhi image uploaded hai uo show karo
  const [frontendImage , setFrontendImage] = useState(myShopData?.image || null)
  // backend image --> jo bhi image upload karna ho backend main
  const [backendImage , setbackendImage] = useState(null)

const handleImage = (e) => {
  // Get the first selected file from the input element
  // e.target.files is an array-like object containing selected files
  const file = e.target.files[0];

  // Store the original file object
  // This is usually sent to the backend (API / server)
  setbackendImage(file);

  // Create a temporary local URL for the selected image
  // This allows us to preview the image in the frontend
  setFrontendImage(URL.createObjectURL(file));
};


// No make the handle Submit function using the APi in backend 
const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  try {
    const formData = new FormData()
    formData.append("name",name)
    formData.append("city",city)
    formData.append("state",state)
    formData.append("address",address)

    if(backendImage){
      formData.append("image",backendImage)
    }

    const result = await axios.post(`${serverUrl}/api/shop/create-edit`, formData , {withCredentials:true})


    dispatch(setMyShopData(result.data))
    toast.success("Shop Updated Successfully")

    // console.log(result.data)
    setLoading(false)
    navigate("/")

  } catch (error) {
    console.log(error)
    setLoading(false)
    toast.error(error?.response?.data?.message)
  }

}


 


  return (
    <div className='flex justify-center flex-col items-center p-6 bg-linear-to-br from-purple-100 relative to-white min-h-screen'>
      <div className='absolute top-5 left-5 z-10 mb-2.5'>
        <IoMdArrowBack size={35} className='text-[#7c3aed]' onClick={() => navigate("/")} />
      </div>
      <div className='max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-purple-100'>
        <div className='flex flex-col mb-6 items-center'>
          <div className='bg-purple-100 p-4 rounded-full mb-4'>
            <FaUtensils className='w-16 h-16 text-[#7c3aed]' />
          </div>
          <div className='text-3xl font-extrabold text-gray-900'>
            {myShopData ? "Edit Shop" : "Add Shop"}
          </div>


        </div>

        <form className='space-y-5' onSubmit={handleSubmit}>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
            <input type="text" placeholder='Enter Shop Name' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400' onChange={(e) => setName(e.target.value)}
              value={name} />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Shop Image</label>
            <input type="file" accept='image/*' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400'onChange={handleImage}  />
            {frontendImage && <div className='mt-4'>
              <img src={frontendImage} alt="" className='w-full h-48 object-cover rounded-lg border' />
            </div>}
            
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* state */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>State</label>
              <input type="text" accept='image/*' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400'
                onChange={(e) => setState(e.target.value)}
                value={state} />
            </div>

            {/* City */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>City</label>
              <input type="text" accept='image/*' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400'
                onChange={(e) => setCity(e.target.value)}
                value={city} />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Address</label>
            <input type="text" placeholder='Enter Shop Address' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400'
              onChange={(e) => setAddress(e.target.value)}
              value={address} />
          </div>
          <button className='w-full bg-[#7c3aed] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-purple-600 hover:shadow-lg transition-all duration-200 cursor-pointer' disabled={loading}>
            {loading ? <ClipLoader size={20} color='white' /> : "Save"}
          </button>

        </form>

      </div>
    </div>
  )
}

export default CreateEditShop