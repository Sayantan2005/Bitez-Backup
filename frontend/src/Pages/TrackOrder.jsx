import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { serverUrl } from '../App'
import { IoMdArrowBack } from 'react-icons/io'
import DeliveryBoyTracking from '../components/DeliveryBoyTracking'
import { useSelector } from 'react-redux'

function TrackOrder() {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const [currentOrder, setCurrentOrder] = useState()

    const {socket} = useSelector(state=>state.user)
    const [liveLocations, setliveLocations] = useState({})
    const handleGetOrder = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/order/get-order-by-id/${orderId}`, { withCredentials: true })
            console.log(result)
            setCurrentOrder(result.data)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
    if (!socket) return;

    const handleUpdate = ({ deliveryBoyId, latitude, longitude }) => {
        setliveLocations(prev => ({
            ...prev,
            [deliveryBoyId]: { lat: latitude, lon: longitude }
        }));
    };

    socket.on('updateDeliveryLocation', handleUpdate);

    return () => {
        socket.off('updateDeliveryLocation', handleUpdate);
    };
}, [socket]);

    useEffect(() => {
        handleGetOrder()
    }, [orderId])
    return (
        <div className='max-w-4xl mx-auto p-4 flex flex-col gap-6 '>
            <div className='relative flex items-center  gap-4top-5 left-5 z-10 mb-2.5'>
                <IoMdArrowBack size={35} className='text-[#7c3aed]' onClick={() => navigate("/")} />
                <h1 className='text-2xl font-bold md:text-center lobster'>Track Order</h1>
            </div>

            {currentOrder?.shopOrders?.map((shopOrder,index)=>(
                <div className='bg-white p-4 rounded-2xl shadow-md border border-purple-100 space-y-4' key={index}>
                    {/* information about shop and order */}
                    <div>
                        <p className='text-lg font-bold mb-2 text-[#7c3aed]'>{shopOrder.shop.name}</p>
                        <p className='font-semibold'><span>Items:</span> {shopOrder.shopOrderItems.map(i=>i.name).join(",")}</p>
                        <p className='font-semibold'><span>Subtotal: </span>{shopOrder.subtotal}</p>
                        <p className='text-gray-700 mt-6'><span className='font-semibold'>Delivery Address: </span>{currentOrder.deliveryAddress?.text}</p>

                    </div >

                    {/* deliveryboy details */}

            

                    {shopOrder.status!="delivered"?
                    <div className='text-sm text-gray-700'>
                    <p className='text-gray-700 font-medium'> <span className='font-semibold'>Delivery Boy Name: </span>{shopOrder.assignedDeliveryBoy?.fullName}</p>
                    <p className='text-gray-700 font-medium'> <span className='font-semibold'>Delivery Boy contact no: </span>{shopOrder.assignedDeliveryBoy?.mobile}</p>
                    {shopOrder.assignedDeliveryBoy?<div>

                    </div>:<p className='font-semibold lobster'>
                        Delivery Boy is not assigned yet
                        </p>}

                    
                    </div>:<p className='text-green-600 font-semibold text-lg lobster'>
                        Orders are Delivered || Thank You!!!
                        </p>}
                        
                    {(shopOrder.assignedDeliveryBoy && shopOrder.status != "delivered") &&
                    <div className='h-100 w-full rounded-2xl overflow-hidden shadow-md'>
                    <DeliveryBoyTracking data={{
                        deliveryBoyLocation:  liveLocations[shopOrder.assignedDeliveryBoy._id] || {
                           
                            lat:shopOrder.assignedDeliveryBoy.location.coordinates[1],
                                lon:shopOrder.assignedDeliveryBoy.location.coordinates[0],
                            },
                        customerLocation: {
                            lat:currentOrder.deliveryAddress.latitude,
                             lon:currentOrder.deliveryAddress.longitude
                        },
                        deliveryBoyName: shopOrder.assignedDeliveryBoy.fullName,
    customerName: currentOrder.user?.fullName
                        
                    }}/> </div>}  





                </div>
            ))}


        </div>
    )
}

export default TrackOrder