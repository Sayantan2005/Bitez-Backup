// No connect frontend backend using socket js
// when a user log in each user has a socektId and the socket io track the user using there socketId so we add a field socketId  in user model

import User from "./models/user.model.js";

// use to store the socketId id to the frontend user

// This function initializes Socket.IO and handles real-time connections
export const socketHandler = (io) => {

    // This event runs whenever a new client connects to the server
    io.on('connection', (socket) => {

        // Listen for 'identity' event from frontend
        // Frontend sends: { userId }
        socket.on('identity', async ({ userId }) => {
            try {
          console.log("Identity received:", userId);
    
                /*
                 WHY this is needed?

                 - When a user connects, they get a unique socket.id
                 - We receive their userId from frontend
                 - We map: userId -> socket.id
                 - So later we can send real-time events to that specific user
                */

                // Update user document in database:
                // 1. Save current socket ID
                // 2. Mark user as online
                const user = await User.findByIdAndUpdate(
                    userId,
                    {
                        socketId: socket.id,   // store current socket ID
                        isOnline: true         // mark user as online
                    },
                    { new: true }             // return updated document
                );

                console.log("User connected & updated:", user?.email);

            } catch (error) {
                console.log("Identity error:", error);
            }

        });

        socket.on('updateLocation',async ({latitude,longitude,userId})=>{
            try {
             const user =  await User.findByIdAndUpdate(userId,{
                    location:{
                        type:'Point',
                        coordinates:[longitude,latitude]
                    },
                    isOnline:true,
                    socketId:socket.id
                })

            if(user){
                 io.emit('updateDeliveryLocation',{
                    deliveryBoyId: userId,
                    latitude,
                    longitude
                 })
            }
              
            } catch (error) {
             console.log('updateDeliveryLocation error')
            }
        })

        socket.on('disconnect', async () => {
            try {
                
              await User.findOneAndUpdate({socketId:socket.id},{
                socketId:null,
                isOnline:false
            })  
            } catch (error) {
                console.log(error)
            }
            

        })
        /*
         IMPORTANT: You should also handle disconnect event
         Otherwise user will remain online even after closing browser
        */
        // socket.on('disconnect', async () => {
        //     try {

        //         // Find user by socketId and mark them offline
        //         await User.findOneAndUpdate(
        //             { socketId: socket.id },
        //             {
        //                 isOnline: false,
        //                 socketId: null
        //             }
        //         );

        //         console.log("User disconnected:", socket.id);

        //     } catch (error) {
        //         console.log("Disconnect error:", error);
        //     }
        // });

    });
};