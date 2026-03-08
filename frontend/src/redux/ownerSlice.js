import { createSlice } from "@reduxjs/toolkit";

const ownerSlice = createSlice({
    name:"owner",
    initialState:{
        myShopData:null,
        
      
    },
    reducers:{
        setMyShopData:(state,action)=>{
            // Store the user data received from the action payload into the Redux state
            state.myShopData = action.payload
        }
       

    }
})

export const {setMyShopData} = ownerSlice.actions

export default ownerSlice.reducer