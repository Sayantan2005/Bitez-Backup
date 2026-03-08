// Custom hook to get the currently logged-in user
// This hook can be reused in multiple components
// Example use cases:
// - On app load (to keep user logged in after refresh)
// - On protected pages (to check authentication)

import axios from 'axios'
import { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'

function getCurrentUser() {
    const dispatch = useDispatch()

    // useEffect runs once when the component using this hook is mounted
    useEffect(() => {

        // Async function to fetch current user data from backend
        const fetchUser = async () => {
            try {
                // Send GET request to backend to fetch logged-in user
                // withCredentials: true → sends cookies (JWT token)
                const result = await axios.get(
                    `${serverUrl}/api/user/current`,
                    { withCredentials: true }
                )

                // // Log the response (user data) to console
                // // In real apps, this is usually saved in state or context
                // console.log(result)

                dispatch(setUserData(result.data.user))

            } catch (error) {
                // Handles errors like:
                // - user not logged in
                // - token expired
                // - server error
                console.log(error)
            }
        }

        // Call the function to fetch user data
        fetchUser()

    }, []) // Empty dependency array → runs only once

}

export default getCurrentUser
