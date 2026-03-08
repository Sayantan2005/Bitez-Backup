import React from 'react'
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { useDispatch } from 'react-redux';
import { removeCartItem, updateQuantity } from '../redux/userSlice';

function CartItemCard({data}) {
    const dispatch = useDispatch()

    const handleIncrease = (id,currentQty)=>{

        dispatch(updateQuantity({id,quantity:currentQty+1}))
    }
    const handleDecrease = (id,currentQty) => {
        if(currentQty>1){
         dispatch(updateQuantity({id,quantity:currentQty-1}))}
    }
  return (
<div className='flex items-center justify-between bg-white p-4 rounded-xl shadow border'>
  
  {/* LEFT SIDE */}
  <div className='flex items-center gap-5'>
    <img
      src={data.image}
      alt=""
      className='w-20 h-20 object-cover rounded-lg border'
    />

    <div>
      <h1 className='font-medium text-lg text-gray-800 lobster'>
        {data.name}
      </h1>
      <p className='text-sm text-gray-500'>
        ₹{data.price} x {data.quantity}
      </p>
      <p className='font-bold text-gray-900'>
        ₹{data.price * data.quantity}
      </p>
    </div>
  </div>

  {/* RIGHT SIDE */}
  <div className='flex items-center gap-3'>
    <button className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer' onClick={()=>handleDecrease(data.id , data.quantity)}>
      <FaMinus size={12} />
    </button>
    <span>{data.quantity}</span>
    <button className='p-2 bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer'>
      <FaPlus size={12} onClick={()=>handleIncrease(data.id , data.quantity)}/>
    </button>
    <button className='p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 ' onClick={()=>dispatch(removeCartItem(data.id))}>
        <FaTrashAlt size={18} />
    </button>
    
  </div>

</div>

  )
}

export default CartItemCard