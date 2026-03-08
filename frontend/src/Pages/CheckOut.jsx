import React, { useEffect, useState } from 'react'
import { IoMdArrowBack } from 'react-icons/io'
import { useNavigate } from 'react-router-dom'
import { FaLocationDot } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { BiCurrentLocation } from "react-icons/bi";
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';
import "leaflet/dist/leaflet.css"  // import the leaflet css file otherwise leaflet css not working
import { setLocation } from '../redux/mapSlice';
import axios from 'axios';
import { addMyOrder, setAddress } from '../redux/userSlice';
import { MdDeliveryDining } from "react-icons/md";
import { FaMobileAlt } from "react-icons/fa";
import { FaCreditCard } from "react-icons/fa6";
import { serverUrl } from '../App';

function RecenterMap({ location }) {
  if (location.lat && location.lon) {
    const map = useMap()
    map.setView([location.lat, location.lon], 16, { animate: true })
  }
  return null
}

function CheckOut() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { location, address } = useSelector(state => state.map)
  const [addressInput, setAddressInput] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const { cartItems, totalAmount, userData } = useSelector(state => state.user)
  const apikey = import.meta.env.VITE_GEOAPIKEY



  const deliveryFee = totalAmount > 500 ? 0 : 40
  const amountwithDeliveryFee = totalAmount + deliveryFee



  const onDragEnd = (e) => {
    console.log(e.target._latlng)
    const { lat, lng } = e.target._latlng
    dispatch(setLocation({ lat, lon: lng }))
    getAddressByLatLng(lat, lng)
  }

  // function to go back to the current location by using current latitude and longitude

  const getCurrentLocation = async () => {
    // navigator.geolocation.getCurrentPosition(async (position) => {
    //   const latitude = position.coords.latitude
    //   const longitude = position.coords.longitude

    const latitude = userData.location.coordinates[1]
    const longitude = userData.location.coordinates[0]

    // setLoaction to set the latitude and longitude to the mapslice
    dispatch(setLocation({ lat: latitude, lon: longitude }))
    getAddressByLatLng(latitude, longitude)
    // })


  }

  // function to get the location by latitude and longitude
  const getAddressByLatLng = async (lat, lng) => {
    try {


      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apikey}`

      )
      console.log(result)
      console.log(result?.data?.results[0].address_line1)
      const address =
        result?.data?.results[0]?.formatted ||
        result?.data?.results[0]?.address_line1 ||
        result?.data?.results[0]?.address_line2

      dispatch(setAddress(address))
      setAddressInput(address)


    } catch (error) {
      console.log(error)
    }
  }


  // use forward Api who takes the text address and give the latitude and longitude 
  const getLatLngByAddress = async () => {
    try {
      const result = await axios.get(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressInput)}&apiKey=${apikey}`)
      const latitude = result.data.features[0].properties.lat
      const longitude = result.data.features[0].properties.lon
      dispatch(setLocation({ lat: latitude, lon: longitude }))

    } catch (error) {
      console.log(error)
    }
  }

  const handlePlaceOrder = async () => {
    try {
      const result = await axios.post(`${serverUrl}/api/order/place-order`, {
        paymentMethod,
        deliveryAddress: {
          text: addressInput,
          latitude: location.lat,
          longitude: location.lon
        },
        // totalAmount, ---> it only show the price of cart items not deliveryfee

        // send total including delivery fee so backend and payment gateway use full amount
        totalAmount: amountwithDeliveryFee,
        cartItems
      }, { withCredentials: true })

      if (paymentMethod == "cod") {
        dispatch(addMyOrder(result.data))
        navigate("/order-placed")
      } else {
        // if the payement is online
        // add rajorpay window open script in index.html
        const orderId = result.data.orderId
        const razorOrder = result.data.razororder
        console.log("FULL RESPONSE:", result.data)
        openRazorpayWindow(orderId, razorOrder)

      }


    } catch (error) {
      console.log(error)
    }
  }

  const openRazorpayWindow = (orderId, razorOrder) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorOrder.amount,
      currency: 'INR',
      name: "Bitez",
      description: "Food Delivery Website",
      order_id: razorOrder.id,
      prefill: {
        name: userData?.fullName || "",
        email: userData?.email || "",
        contact: userData?.mobile || ""
      },
      theme: {
        color: "#7c3aed"
      },
      handler: async function (response) {
        try {
          console.log("Payment successful, verifying...", response)
          const result = await axios.post(`${serverUrl}/api/order/verify-payment`, {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderId
          }, { withCredentials: true })
          console.log("Payment verified successfully:", result.data)
          dispatch(addMyOrder(result.data))
          navigate("/order-placed")
        } catch (error) {
          console.error("Payment verification failed:", error)
          alert("Payment verification failed. Please contact support.")
        }
      },
      modal: {
        ondismiss: function() {
          console.log("Payment window closed by user")
          alert("Payment cancelled. Please try again.")
        }
      }
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  }


  useEffect(() => {
    setAddressInput(address)
  }, [address])



  return (
    <div className='min-h-screen bg-[#f7f3f8] flex items-center justify-center p-6'>
      <div className=' absolute top-5 left-5 z-10' onClick={() => navigate('/cart')}>
        <IoMdArrowBack size={35} className='text-[#7c3aed]' />
      </div>
      <div className='w-full max-w-225 bg-white rounded-2xl shadow-xl p-6 space-y-6'>
        <h1 className='text-2xl font-bold text-gray-800 lobster'>Checkout</h1>
        {/* section for location */}
        <section>
          <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 lobster'><FaLocationDot className='text-[#7c3aed]' />Delivery Location</h2>
          <div className='flex gap-2 mb-3'>
            <input type="text" className='flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]' placeholder='Enter Your Delivery Address...' value={addressInput} onChange={(e) => setAddressInput(e.target.value)} />
            <button className='bg-[#7c3aed] hover:bg-[#ad81f9] text-white px-3 py-2 rounded-lg flex items-center justify-center' onClick={getLatLngByAddress}>
              <FaSearch size={17} />
            </button>
            <button className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center' onClick={getCurrentLocation}>
              <BiCurrentLocation size={17} />
            </button>
          </div>
          <div className='rounded-xl border overflow-hidden'>
            <div className='h-64 w-full items-center justify-center'>
              <MapContainer className={"w-full h-full"}
                center={[location?.lat, location?.lon]}
                zoom={16}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterMap location={location} />
                <Marker position={[location?.lat, location?.lon]} draggable={true} eventHandlers={{ dragend: onDragEnd }} />
              </MapContainer>
            </div>

          </div>
        </section>

        {/* Payment method Section */}
        <section>
          <h2 className='text-lg font-semibold mb-3 text-gray-800 lobster'>Payment Method</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* cod */}
            <div className={`flex items-center gap-3 rounded-xl p-4 text-left transition ${paymentMethod === "cod" ? "border border-[#7c3aed] bg-purple-50 shadow" : "border-gray-200 hover:border-gray-300"} `} onClick={() => setPaymentMethod("cod")}>
              <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                <MdDeliveryDining className='text-green-600 text-xl' />
              </span>
              <div>
                <p className='font-medium text-gray-800'>Cash On Delivery</p>
                <p className='text-xs text-gray-800'>Pay when your food arrives</p>
              </div>
            </div>
            {/* online */}
            <div className={`flex items-center gap-3 rounded-xl p-4 text-left transition ${paymentMethod === "online" ? "border border-[#7c3aed] bg-purple-50 shadow" : "border-gray-200 hover:border-gray-300"} `} onClick={() => setPaymentMethod("online")}>
              <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-100'>
                <FaMobileAlt className='text-orange-700 text-lg' />
              </span>
              <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                <FaCreditCard className='text-blue-700 text-lg' />

              </span>
              <div>
                <p className='font-medium text-gray-800'>UPI / Credit / Debit Card</p>
                <p className='text-xs text-gray-800 '>Pay Securly Online</p>
              </div>
            </div>

          </div>

        </section>

        {/* Order Summary (product , subtotal , quantity etc ) */}
        <section>
          <h2 className='text-lg font-semibold mb-3 text-gray-800 lobster'>Order Summary</h2>
          <div className='rounded-xl border bg-gray-50 space-y-2 p-4'>
            {cartItems.map((item, index) => (
              <div key={index} className='flex justify-between text-sm text-gray-700'>
                <span>{item.name} X {item.quantity}</span>
                <span> ₹{item.price * item.quantity}</span>
              </div>

            ))
            }
            <hr className='border-gray-300 my-2' />
            <div className='flex justify-between font-medium text-gray-800'>
              <span>Subtotal</span>
              <span>{totalAmount}</span>
            </div>
            <div className='flex justify-between text-gray-700'>
              <span>Delivery Fee</span>
              <span>{deliveryFee == 0 ? "Free" : deliveryFee}</span>
            </div>
            <div className='flex justify-between text-lg font-bold text-[#7c3aed] pt-2'>
              <span>Total</span>
              <span>{amountwithDeliveryFee}</span>
            </div>
          </div>
        </section>
        <button className='w-full bg-[#7c3aed] hover:bg-[#965ef6] text-white py-3 rounded-xl font-semibold' onClick={handlePlaceOrder}>
          {paymentMethod == "cod" ? "Place Order" : "Pay & Place Order"}
        </button>
      </div>


    </div>
  )
}

export default CheckOut