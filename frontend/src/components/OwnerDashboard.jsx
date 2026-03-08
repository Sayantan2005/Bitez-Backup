import React from 'react'
import Nav from "./Nav"
import { useSelector } from 'react-redux'
import { FaUtensils } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { FaPenFancy } from "react-icons/fa6";
import OwnerItemCard from './OwnerItemCard';

function OwnerDashboard() {
  const {myShopData} = useSelector(state => state.owner)
  const navigate= useNavigate()

  console.log(myShopData)

  
  return (
     <div className='w-full min-h-screen bg-[#f0f0f2] flex flex-col items-center'>
      <Nav />
      {/* if myShopData is null then show a div section to add a new shop then after adding shop it will show the add food items button */}
      {!myShopData && 
      <div className='flex justify-center items-center p-4 sm:p-6'>
        <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300'>
          <div className='flex flex-col items-center text-center'>
            <FaUtensils className='text-[#7c3aed] w-16 h-16 sm:w-20 sm:h-20 mb-4' />
            <h2 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>Add Your Resturant</h2>
            <p className='text-gray-600 mb-4 text-sm sm:text-base'>Your restaurant is now live on Bitez and ready to reach hungry customers near you. From showcasing your best dishes to receiving real-time orders, Bitez helps you grow faster and smarter</p>
            <button className='bg-[#7c3aed] text-white px-5 sm:px-6 py-2 rounded-full font-medium shadow-md hover:bg-purple-600 transition-colors duration-200' onClick={()=>navigate("/create-edit-shop")}>
              Get Started
            </button >
          </div>
        </div>
        </div>}

      {/*if there is a shop then show the Shop and you can able to edit the shop */}
        {myShopData && 
        <div className='w-full flex flex-col items-center gap-6 px-4 sm:px-6'>

          <h1 className='text-3xl md:text-5xl text-gray-900 flex items-center gap-3 mt-8 text-center font-semibold lobster '> <FaUtensils className='text-[#7c3aed] w-14 h-14' />Welcome to {myShopData.name}</h1>

          <div className='bg-white shadow-lg rounded-xl overflow-hidden border border-purple-200 hover:shadow-2xl transition-all duration-300 w-full max-w-3xl relative'>
            <div className='absolute top-4 right-4 bg-[#7c3aed] text-white p-2 rounded-full shadow-md hover:bg-purple-600 transition-colors cursor-pointer' onClick={()=>navigate('/create-edit-shop')}>
              <FaPenFancy size={20} />
            </div>

            <img src={myShopData.image} alt={myShopData.name} className='w-full h-52 sm:h-64 object-cover' />
            <div className='p-4 sm:p-6'>
            <h1 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>{myShopData.name}</h1>
            <p className='text-gray-500'>{myShopData.city},{myShopData.state}</p>
            <p className='text-gray-500 mb-4'>{myShopData.address}</p>
          </div>
          </div>

          {myShopData?.items?.length==0 && 
            <div className='flex justify-center items-center p-4 sm:p-6'>
        <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300'>
          <div className='flex flex-col items-center text-center'>
            <FaUtensils className='text-[#7c3aed] w-16 h-16 sm:w-20 sm:h-20 mb-4' />
            <h2 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>Add Your Food Item</h2>
            <p className='text-gray-600 mb-4 text-sm sm:text-base'>Add your food items with the dish name, description, price, and special ingredients to help customers choose easily and enjoy a better ordering experience.</p>
            <button className='bg-[#7c3aed] text-white px-5 sm:px-6 py-2 rounded-full font-medium shadow-md hover:bg-purple-600 transition-colors duration-200' onClick={()=>navigate("/add-food")}>
              Add Food
            </button >
          </div>
        </div>
        
            </div>}

            {myShopData?.items?.length>0 && <div className='flex flex-col items-center gap-4 w-full max-w-3xl'>
              {myShopData?.items?.map((item,index)=>(
                <OwnerItemCard data={item} key={index} />
              ))}
              </div>}
          


        </div>
        }



        
    </div>
  )
}

export default OwnerDashboard