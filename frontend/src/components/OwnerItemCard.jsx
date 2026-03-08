import React from 'react'
import { FaPenFancy } from "react-icons/fa6";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setMyShopData } from '../redux/ownerSlice';
import { toast } from 'sonner';

function OwnerItemCard({data}) {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const handleDeleteItem = async()=>{
        try {
            const result = await axios.delete(`${serverUrl}/api/item/delete/${data._id}`,{withCredentials:true})
            dispatch(setMyShopData(result.data))
             toast.success("Item deleted successfully");

        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message)
        }
    }
  return (
    <div className='flex bg-white rounded-lg shadow-md overflow-hidden border border-[#7c3aed] w-full max-w-2xl'>
        <div className='w-36 h-48 shrink-0 bg-gray-50'>
            <img src={data.image} alt="Food View" className='w-full h-full object-cover' />
        </div>
        <div className='flex flex-col justify-between p-3 flex-1'>
            <div className=''>
                <h2 className='text-base font-semibold text-[#7c3aed]'>{data.name}</h2>
                <p><span className='font-medium text-gray-700'>Category:</span> {data.category}</p>
                <p><span className='font-medium text-gray-700'>Food Type:</span> {data.foodType}</p>

            </div>
            <div className='flex items-center justify-between'>
                <div className='font-bold text-[#7c3aed] text-xl'>₹ {data.price}</div>
                <div className='flex items-center gap-2 '>
                    <div className='p-2 rounded-full hover:bg-[#7c3aed]/10 text-[#7c3aed] cursor-pointer' onClick={()=>navigate(`/edit-item/${data._id}`)}>
                        <FaPenFancy size={20} />
                    </div>
                    <div className='p-2 rounded-full hover:bg-[#7c3aed]/10 text-[#7c3aed] cursor-pointer' onClick={handleDeleteItem}>
                        <FaTrashAlt size={20} />
                    </div>
                </div>
                
            </div>


        </div>
        
    </div>
  )
}

export default OwnerItemCard