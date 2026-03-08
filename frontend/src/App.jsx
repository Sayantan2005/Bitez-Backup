import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './Pages/ForgotPassword'
import getCurrentUser from './hooks/getCurrentUser'
import { useDispatch, useSelector } from 'react-redux'
import Home from './Pages/Home'
import useGetCity from './hooks/useGetCity'
import useGetMyShop from './hooks/useGetMyShop'
import CreateEditShop from './Pages/CreateEditShop'
import AddItem from './Pages/AddItem'
import EditItem from './Pages/EditItem'
import useGetShopByCity from './hooks/useGetShopByCity'
import useGetItemsByCity from './hooks/useGetItemsByCity'
import CartPage from './Pages/CartPage'
import CheckOut from './Pages/CheckOut'
import OrderPlaced from './Pages/OrderPlaced'
import MyOrders from './Pages/MyOrders'
import useGetMyOrders from './hooks/useGetMyOrders'
import useUpdateLocation from './hooks/useUpdateLocation'
import TrackOrder from './Pages/TrackOrder'
import Shop from './Pages/Shop'
import { io } from 'socket.io-client'
import { setSocket } from './redux/userSlice'
export const serverUrl = "http://localhost:8000"


function App() {

  const {userData,socket} = useSelector(state=>state.user)
  getCurrentUser() 
  useUpdateLocation()
  useGetCity()
  useGetMyShop()
  useGetShopByCity()
  useGetItemsByCity()
  useGetMyOrders()
  const dispatch = useDispatch()

useEffect(() => {

  // Create a socket connection to backend server
  // withCredentials: true allows cookies (for authentication) to be sent
  const socketInstance = io(serverUrl, { withCredentials: true });

  // Store the socket instance in Redux
  // So it can be accessed globally (for emitting/listening in other components)
  dispatch(setSocket(socketInstance));

  // This event runs when the frontend successfully connects to the backend
  socketInstance.on('connect', () => {

    console.log("Connected to server with socket ID:", socketInstance.id);

  });

  // Optional: Cleanup when component unmounts
  // Prevents memory leaks and duplicate connections
  return () => {
    socketInstance.disconnect();
  };

}, [userData?._id]);


useEffect(() => {
  if (socket && userData) {
    socket.emit("identity", {
      userId: userData._id
    });
  }
}, [socket, userData]);
  

  return (
    <Routes>

  {/* If user is NOT logged in, allow access to SignUp page.
      If user is already logged in, redirect to Home page */}
  <Route
    path="/signup"
    element={!userData ? <SignUp /> : <Navigate to="/" />}
  />

  {/* If user is NOT logged in, show SignIn page.
      Logged-in users are redirected to Home */}
  <Route
    path="/signin"
    element={!userData ? <SignIn /> : <Navigate to="/" />}
  />

  {/* Forgot Password page is accessible only when user is NOT logged in.
      Logged-in users are redirected to Home */}
  <Route
    path="/forgot-password"
    element={!userData ? <ForgotPassword /> : <Navigate to="/" />}
  />

  {/* Home page is a protected route.
      If user is logged in, show Home.
      If not logged in, redirect to SignIn page */}
  <Route
    path="/"
    element={userData ? <Home /> : <Navigate to="/signin" />}
  />
{/* // Protected route: Allows access to Create/Edit Shop page only if the user is authenticated.
// If userData exists, the CreateEditShop component is rendered.
// Otherwise, the user is redirected to the Sign In page. */}
  <Route
    path="/create-edit-shop"
    element={userData ? <CreateEditShop /> : <Navigate to="/signin" />}
  />
  <Route
    path="/add-food"
    element={userData ? <AddItem /> : <Navigate to="/signin" />}
  />
   <Route
    path="/edit-item/:itemId"
    element={userData ? <EditItem /> : <Navigate to="/signin" />}
  />
  <Route
    path="/cart"
    element={userData ? <CartPage /> : <Navigate to="/signin" />}
  />
   <Route
    path="/checkout"
    element={userData ? <CheckOut /> : <Navigate to="/signin" />}
  />
  <Route
    path="/order-placed"
    element={userData ? <OrderPlaced /> : <Navigate to="/signin" />}
  />
   <Route
    path="/my-orders"
    element={userData ? <MyOrders /> : <Navigate to="/signin" />}
  />
<Route
    path="/track-order/:orderId"
    element={userData ? <TrackOrder /> : <Navigate to="/signin" />}
  />

    
<Route
    path="/shop/:shopId"
    element={userData ? < Shop/> : <Navigate to="/signin" />}
  />

</Routes>

  )
}

export default App
