import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: null,
        currentCity: null,
        currentState: null,
        currentAddress: null,
        shopsInMyCity: null,
        itemsInMyCity: null,
        // i assign how the data arrange of items which are added in the cart
        cartItems: [],
        totalAmount:0,
        myOrders:[],
        searchItems:null,
        socket:null //create a socket state
    },
    reducers: {
        setUserData: (state, action) => {
            // Store the user data received from the action payload into the Redux state
            state.userData = action.payload
        },
        setCity: (state, action) => {
            // Store the user data received from the action payload into the Redux state
            state.currentCity = action.payload
        },
        setState: (state, action) => {
            state.currentState = action.payload
        },
        setAddress: (state, action) => {
            state.currentAddress = action.payload
        },
        setShopsInMyCity: (state, action) => {
            state.shopsInMyCity = action.payload
        },
        setItemsInMyCity: (state, action) => {
            state.itemsInMyCity = action.payload
        },
        setSocket:(state,action)=>{
            state.socket = action.payload
        },
        addToCart: (state, action) => {

            // The item sent from the component (product + quantity)
            const cartItem = action.payload

            // Check if the item already exists in the cart using its id
            const existingItem = state.cartItems.find(
                i => i.id == cartItem.id
            )

            if (existingItem) {
                // If item already exists, increase its quantity
                existingItem.quantity += cartItem.quantity
            } else {
                // If item does not exist, add it to the cart
                state.cartItems.push(cartItem)
            }

            state.totalAmount = state.cartItems.reduce((sum,i)=>sum+i.price*i.quantity,0)

            // Debug: log updated cart items
            console.log(state.cartItems)
        },
        
        // reducer for update quantity
        updateQuantity: (state,action)=>{
            const {id,quantity} = action.payload
            const item = state.cartItems.find(i=>i.id==id)
            if(item){
                item.quantity = quantity
            }
             state.totalAmount = state.cartItems.reduce((sum,i)=>sum+i.price*i.quantity,0)
        },

        // remove item from the cart reducer
        removeCartItem:(state,action)=>{
            state.cartItems = state.cartItems.filter(i=>i.id!== action.payload)

            state.totalAmount = state.cartItems.reduce((sum,i)=>sum+i.price*i.quantity,0)
        },

        setMyOrders: (state,action)=>{
            state.myOrders = action.payload
        },
        addMyOrder: (state,action) => {
            state.myOrders = [action.payload , ...state.myOrders]
        },

        // make real time change of status 
        updateOrderStatus: (state,action)=> {
            const {orderId , shopId , status} = action.payload
            const order = state.myOrders.find(o=>o._id==orderId)
            if(order){
                if(order.shopOrders && order.shopOrders.shop._id==shopId){
                    order.shopOrders.status = status
                }
            }
        },

      updateRealTimeOrderStatus: (state, action) => {

    // Extract orderId, shopId, and new status from the dispatched action payload
    const { orderId, shopId, status } = action.payload

    // Find the main order from the Redux state using orderId
    // state.myOrders is assumed to be an array of all orders of the logged-in user
    const order = state.myOrders.find(o => o._id == orderId)

    // If the order exists
    if (order) {

        // Inside that order, find the specific shop order using shopId
        // Each order may contain multiple shopOrders (if multi-vendor order)
        const shopOrder = order.shopOrders.find(
            so => so.shop._id == shopId   // match shop id
        )

        // If the shop order is found
        if (shopOrder) {

            // Update its status in real-time
            // Since Redux Toolkit uses Immer internally,
            // we can directly mutate the state like this
            shopOrder.status = status
        }
    }
},

        setSearchItems:(state,action)=>{
            state.searchItems = action.payload
        }






    }
})

export const { setUserData, setCity, setState, setAddress, setShopsInMyCity, setItemsInMyCity, addToCart , updateQuantity,removeCartItem,setMyOrders,addMyOrder,updateOrderStatus,setSearchItems,setSocket,updateRealTimeOrderStatus } = userSlice.actions

export default userSlice.reducer