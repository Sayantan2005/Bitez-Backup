import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setAddress, setCity, setState } from '../redux/userSlice'
import { setLocation } from '../redux/mapSlice'
import { serverUrl } from '../App'


function useUpdateLocation() {


  const dispatch = useDispatch()

  
  const userData = useSelector(state => state.user)
  const userId = userData._id 

  useEffect(() => {
    const updateLocation = async (lat,lon) => {
        const result = await axios.post(`${serverUrl}/api/user/update-location`,{lat , lon},{withCredentials:true})

        console.log(result.data)
    }
   
   navigator.geolocation.watchPosition((pos)=>{
    updateLocation(pos.coords.latitude , pos.coords.longitude)
   })

  },[userId]) 
}

export default useUpdateLocation




