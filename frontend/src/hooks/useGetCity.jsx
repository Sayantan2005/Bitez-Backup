import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setAddress, setCity, setState } from '../redux/userSlice'
import { setLocation } from '../redux/mapSlice'

/*
  Custom Hook: useGetCity
  ----------------------
  Purpose:
  - Get user's current latitude and longitude using browser Geolocation API
  - Use Geoapify Reverse Geocoding API to convert coordinates into city name
  - Store the city in Redux global state
*/
function useGetCity() {

  // Redux dispatch function to update global state
  const dispatch = useDispatch()

  // Get user-related data from Redux store
  const userData = useSelector(state => state.user)
  const userId = userData._id //we fetch the current userId 

  // Geoapify API key stored securely in .env file
  const apikey = import.meta.env.VITE_GEOAPIKEY
  console.log("API Key:", apikey) // Debug

  /*
    useEffect runs whenever userData changes.
    This ensures the city is fetched after user login
    or when user-related state updates.
  */
  useEffect(() => {

    /*
      Step 1: Get user's current location
      ----------------------------------
      navigator.geolocation is a browser-provided API
      that asks user permission and returns coordinates.
    */
    if (!navigator.geolocation) {
      console.error('Geolocation not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Extract latitude, longitude and accuracy from browser response
        const { latitude, longitude, accuracy } = position.coords

        console.log('Geolocation:', { latitude, longitude, accuracy })
        // store location in mapSlice (keys expected: lat, lon)
        dispatch(setLocation({ lat: latitude, lon: longitude }))

        /*
          Reverse geocode via Geoapify
        */
        const result = await axios.get('https://api.geoapify.com/v1/geocode/reverse', {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
            apiKey: apikey,
          },
        })

        console.log(result)

        const location = result?.data?.results[0]

        const city =
          location?.city ||
          location?.town ||
          location?.village ||
          location?.county ||
          null

        dispatch(setCity(city))
        dispatch(setState(location?.state || null))
        // prefer address_line1 then address_line2
        dispatch(setAddress(location?.address_line1 || location?.address_line2 || null))
      },
      (error) => {
        console.error('Geolocation error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )

  // }, [userData])
  },[userId]) // for fix the location change in map(solution for checkout.jsx) and when the userId will change this hook is call again
}

export default useGetCity





// =============== Chatgpt Solution ===============
// import axios from "axios";
// import { useEffect } from "react";
// import { useDispatch } from "react-redux";
// import { setAddress, setCity, setState } from "../redux/userSlice";

// function useGetCity() {
//   const dispatch = useDispatch();
//   const apikey = import.meta.env.VITE_GEOAPIKEY;

//   useEffect(() => {
//     if (!navigator.geolocation) {
//       console.error("Geolocation not supported");
//       return;
//     }

//     let cancelled = false;

//     const getAccurateCoordinates = () =>
//       new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(
//           (pos) => {
//             const { latitude, longitude, accuracy } = pos.coords;
//             console.log("GPS accuracy:", accuracy);
//             resolve({ latitude, longitude });
//           },
//           reject,
//           {
//             enableHighAccuracy: true,
//             timeout: 20000,
//             maximumAge: 0,
//           }
//         );
//       });

//     const reverseGeocode = async (lat, lon) => {
//       const res = await axios.get(
//         "https://api.geoapify.com/v1/geocode/reverse",
//         {
//           params: {
//             lat,
//             lon,
//             format: "json",
//             apiKey: apikey,
//           },
//         }
//       );

//       console.log("Geoapify raw response:", res.data);

//       const loc = res?.data?.results?.[0];
//       if (!loc) return null;

//       return {
//         exactPlace:
//           loc.suburb ||
//           loc.locality ||
//           loc.hamlet ||
//           loc.village ||
//           null,

//         city:
//           loc.city ||
//           loc.town ||
//           loc.county ||
//           loc.state_district ||
//           null,

//         state: loc.state || null,

//         address:
//           loc.address_line1 ||
//           loc.formatted ||
//           null,
//       };
//     };

//     const fetchLocation = async () => {
//       try {
//         const { latitude, longitude } = await getAccurateCoordinates();
//         const location = await reverseGeocode(latitude, longitude);

//         if (!location || cancelled) return;

//         console.log("Resolved location:", location);

//         // 🔥 ALWAYS SET SOMETHING
//         dispatch(setCity(location.exactPlace || location.city || "Unknown"));
//         dispatch(setState(location.state || "Unknown"));
//         dispatch(setAddress(location.address || "Unknown"));

//         localStorage.setItem("userLocation", JSON.stringify(location));
//       } catch (err) {
//         console.error("Location error:", err);
//       }
//     };

//     fetchLocation();

//     return () => {
//       cancelled = true;
//     };
//   }, [dispatch, apikey]);
// }

// export default useGetCity;
