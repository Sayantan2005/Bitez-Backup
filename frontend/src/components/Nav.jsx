import React from 'react'
import { FaLocationDot } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { IoCartOutline } from "react-icons/io5";
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { LuUtensilsCrossed } from "react-icons/lu";
import axios from 'axios';
import { serverUrl } from '../App';
import { setSearchItems, setUserData } from '../redux/userSlice';
import { toast } from 'sonner';
import { FaPlus } from "react-icons/fa";
import { LuReceiptIndianRupee } from "react-icons/lu";
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';




function UserDashboard() {
    const { userData, currentCity , cartItems } = useSelector(state => state.user)
    const { myShopData } = useSelector(state => state.owner)
    const [showInfo, setShowInfo] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [query ,setQuery] = useState("")
    const dispatch = useDispatch()
    const navigate = useNavigate()

   
    // logout 
    const handlelogout = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
            dispatch(setUserData(null))
            console.log(result)
            toast.success(result.data.message)
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || "Log out failed")
        }
    }

     const handleSearchItems = async () => {
        try {
          const result = await axios.get(`${serverUrl}/api/item/search-items?query=${query}&city=${currentCity}`,{withCredentials:true})
    
          console.log(result.data)
          dispatch(setSearchItems(result.data))
        } catch (error) {
          console.log(error)
        }
      }

      useEffect(()=>{
        if(query){
        handleSearchItems()
        }else{
            dispatch(setSearchItems(null))
        }
        
      },[query])
    return (
        <div className='w-full h-20 flex items-center justify-between md:justify-center gap-7.5 px-5 fixed top-0 z-9999 bg-[#f0f0f2] overflow-visible'>

            {/* the searchbar will show if the role is user otherwise dont show the search bar in mobile or pc both  */}

            {/* for mobile the searchbar */}

            {showSearch && userData.role == "user" && <div className="md:hidden w-[90%] h-17.5  gap-5 bg-white shadow-xl rounded-lg px-4 fixed flex items-center top-20 left-[5%]">

                {/* city */}
                <div className='flex items-center w-[30%] overflow-hidden gap-2.5 px-2.5 border-r-2 border-gray-400 '>
                    <FaLocationDot size={25} className=' text-[#7c3aed]' />
                    <div className='w-[80%] truncate text-gray-600'>{currentCity || "city"}</div>
                </div>
                {/* searchbar */}
                <div className='w-[80%] flex items-center gap-2.5 '>
                    <FaSearch size={25} className='text-[#7c3aed]' />
                    <input type="text" placeholder='Search delicious food....' value={query} onChange={(e)=>setQuery(e.target.value)} className='px-2.5 text-gray-700 outline-0 w-full' />
                </div>
            </div>}



            <h1 className='text-3xl font-bold mb-2 text-[#7c3aed]'>Bitez</h1>

            {userData.role == "user" && <div className="md:w-[60%] lg:w-[40%] h-16 md:flex hidden items-center gap-5 bg-white shadow-xl rounded-lg px-4">

                {/* city */}
                <div className='flex items-center w-[30%] overflow-hidden gap-2.5 px-2.5 border-r-2 border-gray-400 '>
                    <FaLocationDot size={25} className=' text-[#7c3aed]' />
                    <div className='w-[80%] truncate text-gray-600'>{currentCity || "city"} </div>
                </div>
                {/* searchbar */}
                <div className='w-[80%] flex items-center gap-2.5 '>
                    <FaSearch size={25} className='text-[#7c3aed]' />
                    <input type="text" placeholder='Search delicious food....' value={query} onChange={(e)=>setQuery(e.target.value)}  className='px-2.5 text-gray-700 outline-0 w-full' />
                </div>
            </div>}



            <div className='flex items-center gap-4 -right-2'>

                {userData.role == "user" && (showSearch ? <LuUtensilsCrossed size={25} className='text-[#7c3aed] block md:hidden' onClick={() => setShowSearch(false)} /> : <FaSearch size={25} className='text-[#7c3aed] block md:hidden' onClick={() => setShowSearch(true)} />)}

                {/* Add food for owner */}

                {userData.role == "owner" ? 
                <>
                {myShopData && <>
                 <button className='hidden md:flex items-center gap-1 p-2 cursor-pointer rounded-full bg-[#7c3aed]/10 text-[#7c3aed]' onClick={()=>navigate('/add-food')}>
                        <FaPlus size={20} />
                        <span>Add Food Item</span>
                    </button>
                    
                        <button className='flex items-center p-2 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] md:hidden' onClick={()=>navigate('/add-food')}>
                            <FaPlus size={20} />
                        </button>
                </>}
                   
                       
                    <div className='hidden md:flex items-center gap-2 cursor-pointer relative px-3 py-1 rounded-lg bg-[#7c3aed]/10 text-[#7c3aed] font-medium' onClick={()=>navigate("/my-orders")}>
                        <LuReceiptIndianRupee size={20} />
                        <span>My Orders</span>
                        {/* <span className='absolute -right-2 -top-2 text-xs font-bold text-white bg-[#7c3aed] rounded-full px-1.5 py-px'>0</span> */}
                    </div>

                     <div className='md:hidden flex items-center gap-2 cursor-pointer relative px-3 py-1 rounded-lg bg-[#7c3aed]/10 text-[#7c3aed] font-medium'>
                        <LuReceiptIndianRupee size={20} onClick={()=>navigate("/my-orders")}/>
                        
                        {/* <span className='absolute -right-2 -top-2 text-xs font-bold text-white bg-[#7c3aed] rounded-full px-1.5 py-px'>0</span> */}
                    </div>

                </> : (
                    <>
                    {userData.role=="user" &&  <div className='relative cursor-pointer' onClick={()=>navigate("/cart")}>
                            <IoCartOutline size={25} className='text-[#7c3aed]' />
                            <span className='absolute -right-2.25 -top-3 text-[#7c3aed]'>{cartItems.length}</span>
                        </div> }
                       


                      {userData.role!="deliveryBoy" &&  <button className='hidden md:block px-3 py-2 rounded-lg bg-[#7c3aed]/10 text-[#7c3aed] text-sm font-medium' onClick={()=>{navigate("/my-orders")}}>
                            My Orders
                        </button>}
                    </>
                )}



                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#7c3aed] text-white text-[18px] leading-none shadow-xl font-semibold cursor-pointer" onClick={() => setShowInfo(prev => !prev)}>

                    {userData?.fullName.slice(0, 1)}
                </div>
                {/* if the showInfo is true then show this pop up */}

                {showInfo && <div className={`fixed top-20 right-2.5 ${userData.role=="deliveryBoy"?"md:right-[20%] lg:right-[40%]":"md:right-[20%] lg:right-[25%]"}   w-45 bg-white shadow-2xl rounded-xl p-5 flex flex-col gap-2.5 z-9999  `}>
                    <div className='text-[17px] font-semibold'>
                        {userData.fullName}
                    </div>
                     {userData.role=="user" && <div className='md:hidden font-semibold cursor-pointer text-[#7c3aed]' onClick={()=>navigate("/my-orders")}>
                       My Orders
                    </div>}
                    
                    <div className='text-[#e91c1c] font-semibold cursor-pointer' onClick={handlelogout}>Log Out</div>

                </div>}


            </div>
        </div>

    )
}

export default UserDashboard