// Custom hook to get the currently logged-in user
// This hook can be reused in multiple components
// Example use cases:
// - On app load (to keep user logged in after refresh)
// - On protected pages (to check authentication)

import axios from 'axios'
import { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setShopsInMyCity, setUserData } from '../redux/userSlice'

function useGetShopByCity() {
    const dispatch = useDispatch()
    const {currentCity} = useSelector(state=>state.user)

  
    useEffect(() => {

     
        const fetchShops = async () => {
            try {
           
                const result = await axios.get(
                    `${serverUrl}/api/shop/get-by-city/${currentCity}`,
                    { withCredentials: true }
                )

           

                dispatch(setShopsInMyCity(result.data))
                console.log(result.data)

            } catch (error) {
               
                console.log(error)
            }
        }

        fetchShops()

    }, [currentCity])

}

export default useGetShopByCity
