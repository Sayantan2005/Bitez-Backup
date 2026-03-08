import React, { useEffect, useRef, useState } from 'react'
import Nav from "./Nav"
import { categories } from '../category.js'
import CategoryCard from './CategoryCard'
import { FaCircleChevronLeft } from "react-icons/fa6";
import { FaCircleChevronRight } from "react-icons/fa6";
import { useSelector } from 'react-redux';
import FoodCard from './FoodCard.jsx';
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App.jsx';
import { linkWithCredential } from 'firebase/auth';
function UserDashboard() {
  const { currentCity , shopsInMyCity , itemsInMyCity,searchItems } = useSelector(state => state.user)



  // useRef is used to get direct access to a DOM element
  // cateScrollRef will point to the horizontal scroll container
  const cateScrollRef = useRef();

  const shopScrollRef = useRef();


  // State to control visibility of LEFT scroll button
  // true  → show button
  // false → hide button
  const [showLeftCateButton, setShowLeftCateButton] = useState(false);


  // State to control visibility of RIGHT scroll button
  const [showRightCateButton, setShowRightCateButton] = useState(false);

  const [showLeftShopButton, setShowLeftShopButton] = useState(false);


  const [showRightShopButton, setShowRightShopButton] = useState(false);

  const [updatedItemsList , setUpdatedItemsList] = useState([])

  const handleFilterByCategory = (category) => {
    if(category=="All"){
      setUpdatedItemsList(itemsInMyCity)
    }else{
      const filteredList = itemsInMyCity?.filter(i=>i.category===category)
      setUpdatedItemsList(filteredList)

    }

  }

  useEffect(()=>{
    setUpdatedItemsList(itemsInMyCity)
  },[itemsInMyCity])

  const navigate = useNavigate()


  // Function to update visibility of left & right buttons
  // ref → reference to scrollable container
  // setLeftButton → setter for left button visibility
  // setRightButton → setter for right button visibility
  const updateButton = (ref, setLeftButton, setRightButton) => {

    // Get the actual DOM element from ref
    const element = ref.current;

    // Check if element exists
    if (element) {

      // scrollLeft → how much the container is scrolled from the left
      // If scrollLeft > 0, user has scrolled right → show LEFT button
      setLeftButton(element.scrollLeft > 0);

      /*
        scrollWidth  → total width of scrollable content
        clientWidth  → visible width of the container
        scrollLeft   → current horizontal scroll position
  
        If (scrollLeft + clientWidth) < scrollWidth
        → more content is available on the right
        → show RIGHT button
  
        -1 is used to avoid floating-point precision issues
      */
      setRightButton(
        element.scrollLeft + element.clientWidth < element.scrollWidth - 1
      );
    }
  };

 



  // useEffect runs once when the component mounts
  useEffect(() => {

    // Check if the scroll container exists
    if (cateScrollRef.current) {
      updateButton(
        cateScrollRef,
        setShowLeftCateButton,
        setShowRightCateButton
      );

      updateButton(
        shopScrollRef,
        setShowLeftShopButton,
        setShowRightShopButton
      );

      // Add scroll event listener to the container
      // This runs every time the user scrolls horizontally
      cateScrollRef.current.addEventListener("scroll", () => {

        // Update left and right button visibility on scroll
        updateButton(
          cateScrollRef,
          setShowLeftCateButton,
          setShowRightCateButton
        );

      });

      // this is for shop
      shopScrollRef.current.addEventListener("scroll", () => {

        // Update left and right button visibility on scroll
        updateButton(
          cateScrollRef,
          setShowLeftShopButton,
          setShowRightShopButton //this is for shop arrow button
        );

      });

    }

    // Check if the shop scroll container exists
    if (shopScrollRef.current) {


      updateButton(
        shopScrollRef,
        setShowLeftShopButton,
        setShowRightShopButton
      );



      // this is for shop
      shopScrollRef.current.addEventListener("scroll", () => {

        // Update left and right button visibility on scroll
        updateButton(
          shopScrollRef,
          setShowLeftShopButton,
          setShowRightShopButton //this is for shop arrow button
        );

      });

    }

//----------------- this return does not work properly---------->

    // return ()=>{cateScrollRef.current.removeEventListener("scroll",() => {

    //     // Update left and right button visibility on scroll
    //     updateButton(
    //       cateScrollRef,
    //       setShowLeftCateButton,
    //       setShowRightCateButton
    //     );
    //   })

    //   shopScrollRef.current.removeEventListener("scroll",() => {

    //     // Update left and right button visibility on scroll
    //     updateButton(
    //       cateScrollRef,
    //       setShowLeftCateButton,
    //       setShowRightCateButton
    //     )
    //     })}

// ----------------------------------------------------

  }, [categories]); // Empty dependency array → runs only once



  // ================= SCROLL HANDLER =================

  // Function to scroll container horizontally
  // ref → reference of scrollable container
  // direction → "left" or "right"
  const scrollHandler = (ref, direction) => {

    // Ensure the DOM element exists
    if (ref.current) {

      // scrollBy scrolls relative to the current position
      ref.current.scrollBy({

        // Scroll 200px left or right
        // "left"  → move backward
        // "right" → move forward
        left: direction === "left" ? -200 : 200,

        // Smooth scrolling animation
        behavior: "smooth"
      });
    }
  };


  return (
    <div className='w-full min-h-screen bg-[#f0f0f2] flex flex-col items-center'>
      <Nav />
      {searchItems && searchItems.length > 0 && (
        <div className='w-full max-w-6xl fle flex-col gap-5 items-start p-5 bg-white shadow-md rounded-2xl mt-4'>
          <h1 className='text-gray-900 text-2xl sm:text-3xl font-semibold border-b border-gray-200 pb-2 lobster'>Search Results</h1>
          <div className='w-full h-auto flex flex-wrap gap-6 justify-center'>
            {searchItems.map((item ,key)=>(
              <FoodCard data={item} key={item._id}/>
            ))}
          </div>
        </div>
      )}
      {/* category */}
      <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-2.5 '>

        <h1 className='text-gray-800 text-2xl sm:text-3xl lobster'>Inspiration for your first order</h1>
        <div className='w-full relative'>
          {/* click the left button to scroll to left  */}
          {showLeftCateButton && <button className='absolute left-0 top-1/2 -translate-y-1/2 bg-[#7c3aed] text-white p-2 rounded-full shadow-lg hover:bg-[#a67fe7] z-10' onClick={() => scrollHandler(cateScrollRef, "left")}>
            <FaCircleChevronLeft />
          </button>}

          <div className='w-full flex overflow-x-auto gap-4 pb-2 ' ref={cateScrollRef}>
            {categories.map((cate, index) => (
              <CategoryCard name={cate.category} image={cate.image} key={index} onClick={()=>handleFilterByCategory(cate.category)}/>
            ))}
          </div>
          {/* click the right button to scroll to right  */}

          {showRightCateButton && <button className='absolute right-0 top-1/2 -translate-y-1/2 bg-[#7c3aed] text-white p-2 rounded-full shadow-lg hover:bg-[#a67fe7] z-10' onClick={() => scrollHandler(cateScrollRef, "right")}>
            <FaCircleChevronRight />
          </button>}



        </div>

      </div>

      {/* shop */}
      <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-2.5 '>
        <h1 className='text-gray-800 text-2xl sm:text-3xl lobster'>Best Shop in {currentCity} </h1>

        <div className='w-full relative'>
          {/* click the left button to scroll to left  */}
          {showLeftShopButton && <button className='absolute left-0 top-1/2 -translate-y-1/2 bg-[#7c3aed] text-white p-2 rounded-full shadow-lg hover:bg-[#a67fe7] z-10' onClick={() => scrollHandler(shopScrollRef, "left")}>
            <FaCircleChevronLeft />
          </button>}

          <div className='w-full flex overflow-x-auto gap-4 pb-2 ' ref={shopScrollRef}>
            {shopsInMyCity?.map((shop, index) => (
              <CategoryCard name={shop.name} image={shop.image} key={index} onClick={()=>navigate(`/shop/${shop._id}`)}/>
            ))}
          </div>
          {/* click the right button to scroll to right  */}

          {showRightShopButton && <button className='absolute right-0 top-1/2 -translate-y-1/2 bg-[#7c3aed] text-white p-2 rounded-full shadow-lg hover:bg-[#a67fe7] z-10' onClick={() => scrollHandler(shopScrollRef, "right")}>
            <FaCircleChevronRight />
          </button>}



        </div>


      </div>

      {/*  Products */}
      <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-2.5 '>
        <h1 className='text-gray-800 text-2xl sm:text-3xl lobster'>Suggested Food Items</h1>

        <div className='w-full h-auto flex flex-wrap gap-5 justify-center'>
          {updatedItemsList?.map((item,index)=>(
            <FoodCard key={index} data={item} />
          ))}
        </div>
      </div>
    </div>


  )
}

export default UserDashboard