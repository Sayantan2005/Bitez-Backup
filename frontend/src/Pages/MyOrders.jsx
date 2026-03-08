import React from 'react'
import { IoMdArrowBack } from 'react-icons/io'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import UserOrdersCard from '../components/UserOrdersCard'
import OwnerOrdersCard from '../components/OwnerOrdersCard'
import { useEffect } from 'react'
import { setMyOrders, updateRealTimeOrderStatus } from '../redux/userSlice'


function MyOrders() {
  const {userData , myOrders,socket} = useSelector(state=>state.user)
  const navigate = useNavigate()
  const dispatch = useDispatch()

// useEffect runs when `socket`, `userData._id`, or `myOrders` changes
useEffect(() => {

  // Handler function for the 'newOrder' event coming from the socket
  const handleNewOrder = (data) => {

    // Check if the incoming order is meant for this shop owner
    // data.shopOrders?.owner._id is the owner of this specific shopOrder
    // userData._id is the current logged-in shop owner's ID
    if (data.shopOrders?.owner._id === userData._id) {

      // Create a new array of orders by prepending the new order
      // [...myOrders] spreads the current Redux state orders
      // So the new order appears at the top of the list
      const updatedOrders = [data, ...myOrders]

      // Dispatch the new array to Redux
      // This replaces the old state with updatedOrders
      dispatch(setMyOrders(updatedOrders))
    }
  }

  // Subscribe to the 'newOrder' event from the socket
  // Whenever server emits 'newOrder', handleNewOrder will run
  socket?.on('newOrder', handleNewOrder)

  socket?.on('update-status',({orderId , shopId , status , userId})=>{
    if(userId == userData._id){
      dispatch(updateRealTimeOrderStatus({orderId , shopId , status}))
    }
  })

  // Cleanup function to remove listener when component unmounts
  // Or before this effect re-runs (prevents duplicate events)
  return () => {
    socket?.off('newOrder', handleNewOrder)
    socket?.off('update-status')
  }

// Dependency array ensures the effect re-runs when:
// 1. socket changes (maybe reconnects)
// 2. userData._id changes (different user logs in)
// 3. myOrders changes (ensures closure always has latest orders)
}, [socket])


  return (
    <div className='w-full min-h-screen bg-[#f6f2fd] flex justify-center px-4'>
      <div className='w-full max-w-200 p-4'>
         <div className='flex items-center gap-5 mb-6 '>
                  <div className=' z-10 '>
                          <IoMdArrowBack size={35} className='text-[#7c3aed]' onClick={() => navigate("/")} />
                        </div>
                        <h1 className='text-3xl font-bold text-start lobster' >My Orders</h1>
                </div>
        <div className='space-y-6'>
          {myOrders.map((order,index)=>(
            userData.role=="user" ? 
            (
              <UserOrdersCard data={order} key={index}  />
            )
            : userData.role=="owner" ? 
            (
              <OwnerOrdersCard data={order} key={index} />
            )
            :null
          ))}
        </div>


      </div>
    </div>
  )
}

export default MyOrders