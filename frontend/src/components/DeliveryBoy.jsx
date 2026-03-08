import React, { useEffect, useState } from 'react'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { serverUrl } from '../App'
import { toast } from 'sonner'
import DeliveryBoyTracking from './DeliveryBoyTracking'
import { ClipLoader } from 'react-spinners'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function DeliveryBoy() {
  const {userData,socket,currentCity} = useSelector(state => state.user)
  const [currentOrder,setCurrentOrder] = useState()
  const [showOtpBox , setShowOtpBox] =useState(false)
  const [availableAssignments,setAvailableAssignments] = useState([])
  const [otp , setOtp] = useState("")
  const [loading,setLoading] = useState(false)
  const [deliveryBoyLocation , setDeliveryBoyLocation] = useState(null)

  const [todayDeliveries,setTodayDeliverries] = useState([])

useEffect(() => {
  // Only run if socket is connected and user is a delivery boy
  if (!socket || userData.role !== "deliveryBoy") return;

  let watchId;

  // Check if the browser supports geolocation
  if (navigator.geolocation) {

    // Start watching the delivery boy's position continuously
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Extract current latitude and longitude from GPS
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setDeliveryBoyLocation({lat:latitude,lon:longitude})

        // Emit real-time location to the backend using Socket.IO
        // This allows backend to update maps, assign orders, and notify customers
        socket.emit('updateLocation', {
          latitude,
          longitude,
          userId: userData._id
        });
      },
      (error) => {
        // Handle errors like user denying location access or GPS failure
        console.log(error);
      },
      {
        enableHighAccuracy: true, // Request precise GPS coordinates
      }
    );
  }

  // Cleanup function to stop watching the position when component unmounts
  // or if socket/user changes, preventing memory leaks or duplicate updates
  return () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
  };
}, [socket, userData]); // listen this in socket.js file


  const ratePerDelivery = 50
  const totalEarning = todayDeliveries.reduce((sum,d)=>sum+d.count*ratePerDelivery,0)


  const getAssignments = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-assignments`,{withCredentials:true})
      console.log(result.data)


      setAvailableAssignments(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-current-order`,{withCredentials:true})

      console.log(result.data)
      setCurrentOrder(result.data)
      

      
    } catch (error) {
      console.log(error)
    }
  }

  const acceptOrder = async (assignmentId) => {
     try {
      const result = await axios.get(`${serverUrl}/api/order/accept-order/${assignmentId}`,{withCredentials:true})
      await getCurrentOrder() //when the order will be  accepted by the delivery boy then call this funcyion
      // console.log(result.data)
      

      
    } catch (error) {
      console.log(error)
    }
  }

  
  const sendOTP = async () => {
    setLoading(true)
     try {
      const result = await axios.post(`${serverUrl}/api/order/send-delivery-otp`,{
        orderId:currentOrder._id,
        shopOrderId:currentOrder.shopOrder._id
      },{withCredentials:true})
      setLoading(false)
       toast.success(result.data?.message || "OTP sent successfully")
      
      setShowOtpBox(true)

      
      console.log(result.data)

      
    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || " OTP failed to send" )
      setLoading(false)
    }
  }

    const verifyOTP = async () => {
     try {
      setLoading(true)
      const result = await axios.post(`${serverUrl}/api/order/verify-delivery-otp`,{
        orderId:currentOrder._id,
        shopOrderId:currentOrder.shopOrder._id,
        otp
      },{withCredentials:true})
      setLoading(false)
      toast.success(result.data?.message || "OTP verified successfully")
      
      location.reload()
      
      console.log(result.data)

      
    } catch (error) {
      console.log(error)
      toast.error(error?.response?.data?.message || " OTP verification failed" )
      setLoading(false)
    }
  }


      const handleTodayDeliveries = async () => {
     try {
      
      const result = await axios.get(`${serverUrl}/api/order/get-today-deliveries`,
       {withCredentials:true})
    
      console.log(result)
      setTodayDeliverries(result.data)

      
    } catch (error) {
      console.log(error)
      
    }
  }

  useEffect(()=>{
    socket?.on('newAssignment' , (data)=>{
      if(data.sentTo==userData._id){
        setAvailableAssignments(prev => [...prev, data])
      }
    })

    return ()=>{
      socket?.off('newAssignment')
    }
  },[socket])

 

  useEffect(()=>{
    getAssignments()
    getCurrentOrder()
    handleTodayDeliveries()
    
  },[userData])
  return (
    <div className='w-screen min-h-screen bg-[#f0f0f2] flex flex-col items-center gap-5 overflow-y-auto'>
      <Nav />

      <div className='w-full max-w-200 flex flex-col gap-5 items-center'>
        <div className='bg-white rounded-2xl shadow-md p-5 flex flex-col justify-center items-center w-[90%] border border-purple-100 text-center gap-2'>
          <h1 className='text-xl font-bold text-[#7c3aed] lobster'>Welcome, {userData.fullName}</h1>
           <p className='text-[#7c3aed]'> <span className='font-semibold'> City:</span> {currentCity} </p>
          <p className='text-[#7c3aed]'> <span className='font-semibold'> Latitude:</span> {deliveryBoyLocation?.lat}, <span className='font-semibold'>Longitude:</span> {deliveryBoyLocation?.lon}</p>
        </div>

      <div className='bg-white rounded-2xl shadow-md p-5 w-[90%] mb-6 border border-purple-100'>
        <h1 className='text-lg font-bold mb-3 text-[#7c3aed] lobster'>
          Today Deliveries
        </h1>

        {/* // Responsive container makes the chart automatically adjust
// to the width of its parent element 
// npm i recharts
*/}
<ResponsiveContainer width="100%" height={200}>
  
  {/* BarChart component receives data (array of { hour, count }) */}
  <BarChart data={todayDeliveries}>
    
    {/* Adds background grid lines (3px dash pattern) */}
    <CartesianGrid strokeDasharray="3 3" />

    {/* X-Axis displays the hour (e.g., 10, 11, 12) */}
    {/* tickFormatter converts 10 → "10:00" */}
    <XAxis 
      dataKey="hour" 
      tickFormatter={(h) => `${h}:00`} 
    />

    {/* Y-Axis displays delivery count */}
    {/* allowDecimals=false ensures only whole numbers (no 1.5 etc.) */}
    <YAxis allowDecimals={false} />

    {/* Tooltip shows when user hovers over a bar */}
    {/* formatter → formats the value (example: 2 → "2 orders") */}
    {/* labelFormatter → formats the hour label (10 → "10:00") */}
    <Tooltip 
      formatter={(value) => [value, "orders"]} 
      labelFormatter={(label) => `${label}:00`} 
    />

    {/* Bar represents delivery count per hour */}
    {/* dataKey="count" connects to count field from backend */}
    {/* fill sets the bar color */}
    <Bar 
      dataKey="count" 
      fill="#7c3aed" 
    />

  </BarChart>
</ResponsiveContainer>
{/* delivery gets 50 rupees for each delivery */}
<div className='max-w-sm mx-auto mt-6 p-6 bg-white rounded-2xl shadow-lg text-center'>
<h1 className='text-xl font-bold text-gray-800 mb-2 lobster'>  Today's Earning</h1>
<span className='text-3xl font-bold text-green-600'>₹{totalEarning}</span>
</div>
      </div>

        {/* if there is no order accepted */}
{!currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-purple-100'>
          <h1 className='text-lg font-bold mb-4 flex items-center gap-2 lobster'>Available Orders</h1>
          
          <div className='space-y-4'>
            {availableAssignments.length>0?
            (
              availableAssignments.map((a,index)=>(
                <div className='border rounded-lg p-4 flex justify-between items-center' key={index}>
                  <div>
                    <p className='text-sm font-semibold'>{a?.shopName}</p>
                    <p className='text-sm text-gray-500'> <span className='font-semibold'>Delivery Addsress: </span> {a?.deliveryAddress.text}</p>
                    <p className='tetx-xs text-gray-400'>{a.items.length} items | ₹{a.subtotal}</p>


                  </div>
                  <button className='bg-purple-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-purple-600 ' onClick={() => acceptOrder(a.assignmentId)}>Accept</button>
                </div>
              ))
            ):<p className='text-gray-400 text-sm'>No Available Orders</p>}
          </div>
        </div>}

      {/* if a order is assigned */}
        {currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-purple-100'>
          <h2 className='text-lg font-bold mb-3 lobster'>😋Current Order</h2>
          <div className='border rounded-lg p-4 mb-3'>
            <p className='font-bold text-lg lobster text-[#7c3aed]'>{currentOrder?.shopName}</p>
            <p className='font-semibold text-sm'>Customer Details: </p>
            <p className='text-gray-800 text-sm' >{currentOrder?.user?.fullName}</p>
            <p className='text-gray-800 text-sm' >{currentOrder?.user?.mobile}</p>

            <p className='text-sm text-gray-500'>{currentOrder?.deliveryAddress.text}</p>
            <p className='text-xs text-gray-400 '>{currentOrder?.shopOrder.shopOrderItems.length} items | ₹{currentOrder?.shopOrder.subtotal}</p>
          </div>

           {/* map */}
           <DeliveryBoyTracking data={
            {
              deliveryBoyLocation:deliveryBoyLocation||{
                           
                            lat:userData.location.coordinates[1],
                                lon:userData.location.coordinates[0],
                            },
                        customerLocation: {
                            lat:currentOrder.deliveryAddress.latitude,
                             lon:currentOrder.deliveryAddress.longitude
                        },
                        deliveryBoyName: currentOrder?.shopOrder?.assignedDeliveryBoy?.fullName,
    customerName: currentOrder.user?.fullName
            }
           }/>

           {!showOtpBox ? <button className='mt-4 w-full bg-green-500 font-semibold py-2 px-4 rounded-2xl shadow-md hover:bg-green-600 active:scale-95 transition-all duration-200' onClick={sendOTP} disabled={loading}>
            {loading ? <ClipLoader size={20} color='white'/> :
            "Mark as Delivered"}
           </button> : <div className='mt-4 p-4 border rounded-xl bg-gray-50'>
            <p className='text-sm font-semibold mb-2'>Enter OTP send to <span className='text-purple-500'>{currentOrder.user.fullName}</span></p>
            <input type="text" className='w-full border px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-purple-400' placeholder='Enter OTP...' value={otp} onChange={(e)=>setOtp(e.target.value)} />

            <button className='w-full bg-purple-500 text-white py-2 rounded-lg font-semibold hover:bg-purple-600 transition-all' onClick={verifyOTP} disabled={loading}>{loading ? <ClipLoader size={20} color='white'/>:"Submit"} OTP</button>

           </div> }
           
          </div>}

         


        

      </div>
    </div>
  )
}

export default DeliveryBoy