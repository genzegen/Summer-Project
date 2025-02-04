const scrollContainer = document.querySelector('.steps-scroll-container');
const scrollItems = document.querySelectorAll('.steps-scroll'); // Assuming each scroll item has the class 'scroll-item'

scrollContainer.addEventListener('wheel', (event) => {
    // Check if the cursor is over any of the scroll items
    const isOverScrollItem = Array.from(scrollItems).some(item => item.contains(event.target));
    
    if (isOverScrollItem) {
        event.preventDefault();
        scrollContainer.scrollLeft += event.deltaY * 3; // changing vertical scroll to horizontal
    }
});

let isDragging = false; // the user is not dragging at first
let startX; // store the starting X position of the cursor
let scrollLeft; // store the initial scroll position of the container

// Mouse down: Start dragging
scrollContainer.addEventListener('mousedown', (event) => {
    const isOverScrollItem = Array.from(scrollItems).some(item => item.contains(event.target));
    
    if (isOverScrollItem) {
        isDragging = true;
        startX = event.pageX - scrollContainer.offsetLeft; // get cursor X position relative to the container
        scrollLeft = scrollContainer.scrollLeft; // get current scroll position
        scrollContainer.style.cursor = 'grabbing'; // change cursor to indicate dragging
    }
});

// Mouse move: Scroll while dragging
scrollContainer.addEventListener('mousemove', (event) => {
    if (!isDragging) return; // Exit if not dragging
    event.preventDefault();
    const x = event.pageX - scrollContainer.offsetLeft; // Get current cursor X position
    const walk = (x - startX) * 2; // Calculate the distance moved (adjust multiplier for speed)
    scrollContainer.scrollLeft = scrollLeft - walk; // Update the scroll position
});

// Mouse up or leave: Stop dragging
const stopDragging = () => {
    isDragging = false;
    scrollContainer.style.cursor = 'grab'; // Reset cursor style
};
scrollContainer.addEventListener('mouseup', stopDragging);
scrollContainer.addEventListener('mouseleave', stopDragging);

// Get all step details elements
const stepDetails = document.querySelectorAll('.stepDetails');

// Add a mouseover event listener to each .stepDetails
stepDetails.forEach(step => {
    step.addEventListener('mouseover', function () {
        this.classList.add('hovered'); // Add the 'hovered' class when hovered
    });
});