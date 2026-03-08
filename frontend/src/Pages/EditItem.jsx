import React, { useEffect, useState } from 'react'
import { FaUtensils } from 'react-icons/fa'
import { IoMdArrowBack } from 'react-icons/io'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { setMyShopData } from '../redux/ownerSlice'
import axios from 'axios'
import { serverUrl } from '../App'
import { ClipLoader } from 'react-spinners'
import { toast } from 'sonner'

function EditItem() {
  const navigate = useNavigate()

  const { myShopData } = useSelector(state => state.owner)

  const {itemId} = useParams() //take the itemId from the url parameter 
   const [currentItem,setCurrentItem] = useState(null)

  const dispatch = useDispatch()


  const [name, setName] = useState("")
  const [price, setPrice] = useState(0)

  // forntend image --> jo bhi image uploaded hai uo show karo
  const [frontendImage, setFrontendImage] = useState("")
  // backend image --> jo bhi image upload karna ho backend main
  const [backendImage, setbackendImage] = useState(null)
  const [category, setCategory] = useState("")
  const [foodtype, setFoodType] = useState("")

  const [loading , setLoading] = useState(false)

 

  const categories = ["Snacks",
    "Main Course",
    "Desserts",
    "Pizza",
    "Burgers",
    "Sandwitch",
    "South Indian",
    "North Indian",
    "Chinese",
    "Fast Food",
    "Others"]


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
      formData.append("name", name)
      formData.append("category", category)
      formData.append("foodType", foodtype)
      formData.append("price", price)

      if (backendImage) {
        formData.append("image", backendImage)
      }

      const result = await axios.post(`${serverUrl}/api/item/edit-item/${itemId}`, formData, { withCredentials: true})

      toast.success("Item updated successfully")


      dispatch(setMyShopData(result.data))

      // console.log(result.data.shop)
      setLoading(false)

      
      navigate("/")

    } catch (error) {
      console.log(error)
      setLoading(false)
      toast.error(error?.response?.data?.message)
    }

  }


 useEffect(() => {

  // Function to fetch a single item using its ID
  const handleGetItemById = async () => {
    try {
      // Send GET request to backend to fetch item details
      // itemId comes from URL params or state
      // withCredentials:true allows cookies (JWT/session) to be sent
      const result = await axios.get(
        `${serverUrl}/api/item/get-by-id/${itemId}`,
        { withCredentials: true }
      )

      // Store fetched item data in state
      // This data is usually used to prefill the edit form
      setCurrentItem(result.data)

    } catch (error) {
      // Log error if API call fails
      // (e.g., item not found, server error, network issue)
      console.log(error)
    }
  }

  // Call the function when the component loads
  // or whenever itemId changes
  handleGetItemById()

// Dependency array:
// useEffect will re-run only if itemId changes
}, [itemId])

useEffect(()=>{
  setName(currentItem?.name || "")
  setPrice(currentItem?.price || 0)
  setFrontendImage(currentItem?.image || "")
  setFoodType(currentItem?.foodtype || "")
  setCategory(currentItem?.category || "")

},[currentItem])


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
            Edit Food Item
          </div>


        </div>

        <form className='space-y-5' onSubmit={handleSubmit}>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
            <input type="text" placeholder='Enter Food Name' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400' onChange={(e) => setName(e.target.value)}
              value={name} />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Food Image</label>
            <input type="file" accept='image/*' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400' onChange={handleImage} />
            {frontendImage && <div className='mt-4'>
              <img src={frontendImage} alt="" className='w-full h-48 object-cover rounded-lg border' />
            </div>}

          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Price</label>
            <input type="number" placeholder="0" className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400' onChange={(e) => setPrice(e.target.value)}
              value={price} />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Select Category</label>
            <select placeholder="Select Category" className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400' onChange={(e) => setCategory(e.target.value)}
              value={category}>
              <option value="">Select Category</option>
              {categories.map((cate, index) => (
                <option value={cate} key={index}>{cate}</option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Select Food Type</label>
            <select placeholder="Select Category" className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400' onChange={(e) => setFoodType(e.target.value)}
              value={foodtype}>
              <option value="veg">Veg</option>
              <option value="non veg">Non-Veg</option>

            </select>
          </div>


          <button className='w-full bg-[#7c3aed] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-purple-600 hover:shadow-lg transition-all duration-200 cursor-pointer' disabled={loading} >
            {loading ? <ClipLoader size={20} color='white'/> : "Save"}
            
          </button>

        </form>

      </div>
    </div>
  )
}

export default EditItem