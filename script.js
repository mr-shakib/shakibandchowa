// ===== FIREBASE DATA MANAGEMENT =====
// Global state for app data (unified for both Firebase and local state)
let firebaseData = {
    user: {
        galleryPassword: "ourlove123" // Default password until fetched from Firebase
    },
    upcomingDates: [],
    dateHistory: [],
    photos: [],
    popupSchedule: ["2025-07-03"] // Friendship Day
};

// Initial data loading from Firebase
async function loadFirebaseData() {
    showLoadingOverlay("Loading our love story...");
    
    try {
        // Load user settings
        const userDoc = await userCollection.doc('settings').get();
        if (userDoc.exists) {
            firebaseData.user = userDoc.data();
        } else {
            // Create default user settings if they don't exist
            await userCollection.doc('settings').set(firebaseData.user);
        }
        
        // Load popup schedule
        const settingsDoc = await settingsCollection.doc('popupSchedule').get();
        if (settingsDoc.exists) {
            firebaseData.popupSchedule = settingsDoc.data().dates || ["2025-07-03"];
        } else {
            // Create default popup schedule if it doesn't exist
            await settingsCollection.doc('popupSchedule').set({ dates: firebaseData.popupSchedule });
        }
        
        // Load upcoming dates
        const upcomingDatesSnapshot = await upcomingDatesCollection.orderBy('date').get();
        firebaseData.upcomingDates = upcomingDatesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Load date history
        const dateHistorySnapshot = await dateHistoryCollection.orderBy('date', 'desc').get();
        firebaseData.dateHistory = dateHistorySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Load photos
        const photosSnapshot = await photosCollection.orderBy('uploadedAt', 'desc').get();
        firebaseData.photos = photosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('Firebase data loaded successfully');
    } catch (error) {
        console.error('Error loading data from Firebase:', error);
        // Fallback to local data or show an error message
        showErrorMessage("Couldn't connect to our love database! 💔 Check your internet connection.");
    } finally {
        hideLoadingOverlay();
    }
}

// Save data to Firebase
async function saveFirebaseData() {
    try {
        // We don't need to save everything every time, but for simplicity we're doing it this way
        // In a real app, you'd only update the changed collection
        
        // Update user settings
        await userCollection.doc('settings').set(firebaseData.user);
        
        // Update popup schedule
        await settingsCollection.doc('popupSchedule').set({ dates: firebaseData.popupSchedule });
        
        // No need to update other collections as they're handled by individual functions
        
        console.log('Firebase data saved successfully');
    } catch (error) {
        console.error('Error saving data to Firebase:', error);
        showErrorMessage("Couldn't save to our love database! 💔 Try again?");
    }
}

// Set up real-time listeners for data changes
function setupRealTimeListeners() {
    // Listen for changes in upcoming dates
    upcomingDatesCollection.orderBy('date').onSnapshot(snapshot => {
        const changes = snapshot.docChanges();
        let shouldUpdateCountdown = false;
        
        changes.forEach(change => {
            if (change.type === 'added') {
                const newDate = {
                    id: change.doc.id,
                    ...change.doc.data()
                };
                firebaseData.upcomingDates.push(newDate);
                shouldUpdateCountdown = true;
            }
            if (change.type === 'modified') {
                const index = firebaseData.upcomingDates.findIndex(date => date.id === change.doc.id);
                if (index !== -1) {
                    firebaseData.upcomingDates[index] = {
                        id: change.doc.id,
                        ...change.doc.data()
                    };
                    shouldUpdateCountdown = true;
                }
            }
            if (change.type === 'removed') {
                firebaseData.upcomingDates = firebaseData.upcomingDates.filter(date => date.id !== change.doc.id);
                shouldUpdateCountdown = true;
            }
        });
        
        if (shouldUpdateCountdown) {
            updateCountdownCard();
        }
    }, error => {
        console.error("Error listening to upcoming dates:", error);
    });
    
    // Listen for changes in date history
    dateHistoryCollection.orderBy('date', 'desc').onSnapshot(snapshot => {
        const changes = snapshot.docChanges();
        let shouldUpdateHistory = false;
        
        changes.forEach(change => {
            if (change.type === 'added') {
                const newHistoryItem = {
                    id: change.doc.id,
                    ...change.doc.data()
                };
                firebaseData.dateHistory.push(newHistoryItem);
                shouldUpdateHistory = true;
            }
            if (change.type === 'modified') {
                const index = firebaseData.dateHistory.findIndex(item => item.id === change.doc.id);
                if (index !== -1) {
                    firebaseData.dateHistory[index] = {
                        id: change.doc.id,
                        ...change.doc.data()
                    };
                    shouldUpdateHistory = true;
                }
            }
            if (change.type === 'removed') {
                firebaseData.dateHistory = firebaseData.dateHistory.filter(item => item.id !== change.doc.id);
                shouldUpdateHistory = true;
            }
        });
        
        // If we're on the history page and changes occurred, update the view
        if (shouldUpdateHistory && !document.getElementById('historyPage').classList.contains('hidden')) {
            populateHistory();
        }
    }, error => {
        console.error("Error listening to date history:", error);
    });
    
    // Listen for changes in photos
    photosCollection.orderBy('uploadedAt', 'desc').onSnapshot(snapshot => {
        const changes = snapshot.docChanges();
        let shouldUpdateGallery = false;
        
        changes.forEach(change => {
            if (change.type === 'added') {
                const newPhoto = {
                    id: change.doc.id,
                    ...change.doc.data()
                };
                firebaseData.photos.push(newPhoto);
                shouldUpdateGallery = true;
            }
            if (change.type === 'modified') {
                const index = firebaseData.photos.findIndex(photo => photo.id === change.doc.id);
                if (index !== -1) {
                    firebaseData.photos[index] = {
                        id: change.doc.id,
                        ...change.doc.data()
                    };
                    shouldUpdateGallery = true;
                }
            }
            if (change.type === 'removed') {
                firebaseData.photos = firebaseData.photos.filter(photo => photo.id !== change.doc.id);
                shouldUpdateGallery = true;
            }
        });
        
        // If we're on the gallery page and changes occurred, update the view
        if (shouldUpdateGallery && !document.getElementById('galleryContent').classList.contains('hidden')) {
            populatePhotoGrid();
        }
    }, error => {
        console.error("Error listening to photos:", error);
    });
}

// ===== RESTAURANT DATA =====
const restaurantData = {
    dhanmondi: [
        // Visited Restaurants
        { 
            name: "KFC", 
            type: "Comfort Food 🍗", 
            image: "https://kfcbd.com/storage/products/k8kyCyznKk5bG75XFqUJXsNlO.jpg",
            visited: true
        },
        { 
            name: "Pizzaburg", 
            type: "Pizza & Burgers 🍕", 
            image: "https://giftall.s3.amazonaws.com/uploads/images/packages/package_653f6ffb840bb_122732475.jpg",
            visited: true
        },
        { 
            name: "KOI THE", 
            type: "Bubble Tea & Treats 🧋", 
            image: "https://www.koithe.com/upload_image/news/news_663.jpg",
            visited: true
        },
        { 
            name: "Sultan's Dine", 
            type: "Traditional Elegance 👑", 
            image: "https://ecdn.dhakatribune.net/contents/cache/images/640x359x1/uploads/media/2023/09/27/sultan-kacchi-28e4136b8b28e13f514e24b144324462.jpg?jadewits_media_id=5333",
            visited: true
        },
        { 
            name: "Chillox", 
            type: "Modern & Trendy 🌟", 
            image: "https://www.reserveitbd.com/_next/image?url=https%3A%2F%2Fik.imagekit.io%2Feq6wnmjdp%2FVendorGalleries%2F349%2F349_ae84be98-068b-4e7e-8b38-27fa87a4e146_Cover.jpg&w=3840&q=75",
            visited: true
        },
        // Could Try (Not Visited)
        { 
            name: "Star Hotel and Kabab", 
            type: "Grilled Specialties 🔥", 
            image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/12/46/7e/91/photo1jpg.jpg?w=900&h=500&s=1",
            visited: false
        },
        { 
            name: "Koryori", 
            type: "Asian Fusion 🥢", 
            image: "https://images.deliveryhero.io/image/fd-bd/LH/h5o2-listing.jpg",
            visited: false
        },
        { 
            name: "Madchef", 
            type: "Creative Cuisine 👨‍🍳", 
            image: "https://images.deliveryhero.io/image/fd-bd/bd-logos/ce2hc-logo.jpg",
            visited: false
        },
        { 
            name: "Herfy", 
            type: "Middle Eastern 🥙", 
            image: "https://herfybd.com/assets/image/gulshan3.jpg",
            visited: false
        },
        { 
            name: "Add Your Favourite", 
            type: "Your Choice 💕", 
            image: "https://gettingtotruelove.com/wp-content/uploads/2017/01/Its-always-your-choice.jpg",
            visited: false,
            custom: true
        }
    ],
    mirpur: [
        // Visited Restaurants
        { 
            name: "KFC", 
            type: "Comfort Food 🍗", 
            image: "https://kfcbd.com/storage/products/k8kyCyznKk5bG75XFqUJXsNlO.jpg",
            visited: true
        },
        { 
            name: "Pizzaburg", 
            type: "Pizza & Burgers 🍕", 
            image: "https://giftall.s3.amazonaws.com/uploads/images/packages/package_653f6ffb840bb_122732475.jpg",
            visited: true
        },
        { 
            name: "Sultan's Dine", 
            type: "Traditional Elegance 👑", 
            image: "https://ecdn.dhakatribune.net/contents/cache/images/640x359x1/uploads/media/2023/09/27/sultan-kacchi-28e4136b8b28e13f514e24b144324462.jpg?jadewits_media_id=5333",
            visited: true
        },
        { 
            name: "Chillox", 
            type: "Modern & Trendy 🌟", 
            image: "https://www.reserveitbd.com/_next/image?url=https%3A%2F%2Fik.imagekit.io%2Feq6wnmjdp%2FVendorGalleries%2F349%2F349_ae84be98-068b-4e7e-8b38-27fa87a4e146_Cover.jpg&w=3840&q=75",
            visited: true
        },
        // Could Try (Not Visited)
        { 
            name: "Fuoco", 
            type: "Italian Fine Dining 🍝", 
            image: "https://images.deliveryhero.io/image/fd-bd/bd-logos/cw0xb-logo.jpg",
            visited: false
        },
        { 
            name: "Roadside Kitchen", 
            type: "Street Food Vibes 🍛", 
            image: "https://www.moumachi.com.bd//images/listings/41972/business/20239-266798038-670378134341597-7554017653012876605-n.jpg",
            visited: false
        },
        { 
            name: "Add Your Favourite", 
            type: "Your Choice 💕", 
            image: "https://gettingtotruelove.com/wp-content/uploads/2017/01/Its-always-your-choice.jpg",
            visited: false,
            custom: true
        }
    ],
    uttara: [
        // Visited Restaurants
        { 
            name: "Pizzaburg", 
            type: "Pizza & Burgers 🍕", 
            image: "https://giftall.s3.amazonaws.com/uploads/images/packages/package_653f6ffb840bb_122732475.jpg",
            visited: true
        },
        { 
            name: "KOI THE", 
            type: "Bubble Tea & Treats 🧋", 
            image: "https://www.koithe.com/upload_image/news/news_663.jpg",
            visited: true
        },
        { 
            name: "Alfresco", 
            type: "Outdoor Dining 🌿", 
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRupj2hEz804HWUDzLihTQAQvUGAppFbMY_aQ&s",
            visited: true
        },
        // Could Try (Not Visited)
        { 
            name: "KFC", 
            type: "Comfort Food 🍗", 
            image: "https://kfcbd.com/storage/products/k8kyCyznKk5bG75XFqUJXsNlO.jpg",
            visited: false
        },
        { 
            name: "Takeout", 
            type: "Quick Bites 🥡", 
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJSx4h0JclAXKJ0Ew4QnYhqkDTT7ZEVX_piA&s",
            visited: false
        },
        { 
            name: "Digger", 
            type: "Unique Experience 🏗️", 
            image: "https://www.tbsnews.net/sites/default/files/styles/infograph/public/images/2021/12/09/food_dhanmondi_11.jpg",
            visited: false
        },
        { 
            name: "Chillox", 
            type: "Modern & Trendy 🌟", 
            image: "https://www.reserveitbd.com/_next/image?url=https%3A%2F%2Fik.imagekit.io%2Feq6wnmjdp%2FVendorGalleries%2F349%2F349_ae84be98-068b-4e7e-8b38-27fa87a4e146_Cover.jpg&w=3840&q=75",
            visited: false
        },
        { 
            name: "Crimson Cup", 
            type: "Coffee & More ☕", 
            image: "https://www.crimsoncup.com/assets/cc_bangladesh_DhanmondiSouth.jpeg",
            visited: false
        },
        { 
            name: "Add Your Favourite", 
            type: "Your Choice 💕", 
            image: "https://gettingtotruelove.com/wp-content/uploads/2017/01/Its-always-your-choice.jpg",
            visited: false,
            custom: true
        }
    ]
};

// ===== GLOBAL VARIABLES =====
let currentStep = 'location';
let selectedLocation = '';
let selectedRestaurant = '';
let popupAttempts = 0;
let isGalleryUnlocked = false;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize debug panel
    initializeDebugPanel();
    
    try {
        // Show the animation page first
        hideAllPages();
        document.getElementById('customAnimationPage').classList.remove('hidden');

        // Wait a moment for Firebase to fully initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test Firebase connection first
        const firebaseConnected = await testFirebaseConnection();
        
        if (firebaseConnected) {
            // Load data from Firebase in the background
            await loadFirebaseData();
            // Set up real-time listeners for data changes
            setupRealTimeListeners();
        } else {
            console.warn("Falling back to local storage mode");
        }
        
        // Initialize UI components that are not visible yet
        initializeEventListeners();
        initializeDateDetailsModal();
        updateCountdownCard();
        
        // Show popup after 5 seconds if on main pages
        setTimeout(showRandomDatePopup, 5000);
    } catch (error) {
        console.error("Initialization error:", error);
        showErrorMessage("Something went wrong! 💔 Please try refreshing the page.");
    }
});

function showLoadingScreen() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoadingScreen() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// ===== LOADING OVERLAY FUNCTIONS =====
function showLoadingOverlay(message) {
    const overlay = document.getElementById('loadingOverlay');
    const messageElement = overlay.querySelector('p');
    messageElement.textContent = message || 'Loading our love story...';
    overlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showDashboard() {
    hideAllPages();
    const dashboard = document.getElementById('dashboard');
    dashboard.classList.remove('hidden');
    
    // Trigger dashboard entrance animation
    setTimeout(() => {
        dashboard.classList.add('active');
    }, 50);
    
    // Trigger card animations with stagger effect
    const cards = dashboard.querySelectorAll('.animated-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${0.1 + (index * 0.1)}s`;
        card.classList.add('animate-in');
    });
    
    updateCountdownCard();
}

function hideAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add('hidden'));
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // New animation enter button
    // Note: Let's Go button is handled by the dedicated setup function above
    // to ensure it works regardless of initialization issues
    
    /*
    // Enhanced "Let's Go" button with smooth transition
    document.getElementById('letsGoBtn').addEventListener('click', function() {
        // Add click animation to button
        this.style.transform = 'scale(0.95)';
        this.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            this.style.transform = '';
            // Add fade out to homepage
            document.getElementById('customAnimationPage').style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            document.getElementById('customAnimationPage').style.opacity = '0';
            document.getElementById('customAnimationPage').style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                showDashboard();
                // Reset homepage for next time
                setTimeout(() => {
                    document.getElementById('customAnimationPage').style.opacity = '';
                    document.getElementById('customAnimationPage').style.transform = '';
                }, 100);
            }, 300);
        }, 100);
    });
    */
    
    // Dashboard card clicks
    document.getElementById('planCard').addEventListener('click', showPlanDatePage);
    document.getElementById('historyCard').addEventListener('click', showHistoryPage);
    document.getElementById('galleryCard').addEventListener('click', showGalleryPage);
    document.getElementById('countdownCard').addEventListener('click', function() {
        // If there are upcoming dates, the clickable countdown will handle the click
        // Otherwise, go to plan page
        if (firebaseData.upcomingDates.length === 0) {
            showPlanDatePage();
        }
    });
    
    // Back buttons
    document.getElementById('backToDashboard').addEventListener('click', showDashboard);
    document.getElementById('backFromHistory').addEventListener('click', showDashboard);
    document.getElementById('backFromGallery').addEventListener('click', showDashboard);
    
    // Plan date page
    initializePlanDateEventListeners();
    
    // Gallery
    initializeGalleryEventListeners();
    
    // Popup
    initializePopupEventListeners();
}

function initializePlanDateEventListeners() {
    // Location selection
    const locationCards = document.querySelectorAll('.location-card');
    locationCards.forEach(card => {
        card.addEventListener('click', function() {
            selectedLocation = this.dataset.location;
            selectLocationCard(this);
            showRestaurantStep();
        });
    });
    
    // Confirm date
    document.getElementById('confirmDate').addEventListener('click', confirmNewDate);
}

function initializeGalleryEventListeners() {
    document.getElementById('unlockGallery').addEventListener('click', unlockGallery);
    document.getElementById('galleryPasswordInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            unlockGallery();
        }
    });
    document.getElementById('addPhoto').addEventListener('click', addPhoto);
}

function initializePopupEventListeners() {
    document.getElementById('popupYes').addEventListener('click', function() {
        hidePopup();
        showSuccessMessage("Yay! Let's plan something magical! 💕");
        setTimeout(() => showPlanDatePage(), 1000);
    });
    
    document.getElementById('popupNo').addEventListener('click', handlePopupNo);
}

// ===== PLAN DATE FUNCTIONALITY =====
function showPlanDatePage() {
    hideAllPages();
    document.getElementById('planDatePage').classList.remove('hidden');
    resetPlanDatePage();
}

function resetPlanDatePage() {
    currentStep = 'location';
    selectedLocation = '';
    selectedRestaurant = '';
    
    // Show location step, hide others
    document.getElementById('locationStep').classList.remove('hidden');
    document.getElementById('restaurantStep').classList.add('hidden');
    document.getElementById('timeStep').classList.add('hidden');
    
    // Clear selections
    document.querySelectorAll('.location-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateInput').min = today;
    document.getElementById('dateInput').value = '';
    document.getElementById('timeInput').value = '';
}

function selectLocationCard(selectedCard) {
    document.querySelectorAll('.location-card').forEach(card => {
        card.classList.remove('selected');
    });
    selectedCard.classList.add('selected');
}

function showRestaurantStep() {
    document.getElementById('locationStep').classList.add('hidden');
    document.getElementById('restaurantStep').classList.remove('hidden');
    
    populateRestaurants();
}

function populateRestaurants() {
    const restaurantGrid = document.getElementById('restaurantGrid');
    restaurantGrid.innerHTML = '';
    
    const restaurants = restaurantData[selectedLocation] || [];
    
    restaurants.forEach(restaurant => {
        const restaurantCard = document.createElement('div');
        restaurantCard.className = 'restaurant-card';
        restaurantCard.dataset.restaurant = restaurant.name;
        
        // Generate status badge
        let statusBadge = '';
        if (restaurant.visited) {
            statusBadge = '<div class="status-badge visited-badge">✓ Visited</div>';
        } else if (restaurant.custom) {
            statusBadge = '<div class="status-badge custom-badge">💕 Your Choice</div>';
        } else {
            statusBadge = '<div class="status-badge could-try-badge">? Could Try</div>';
        }
        
        restaurantCard.innerHTML = `
            <div class="restaurant-card-inner">
                <img src="${restaurant.image}" alt="${restaurant.name}" class="restaurant-image">
                ${statusBadge}
                <div class="restaurant-details">
                    <h4>${restaurant.name}</h4>
                    <p>${restaurant.type}</p>
                </div>
            </div>
        `;
        
        restaurantCard.addEventListener('click', function() {
            if (restaurant.custom) {
                handleCustomRestaurant();
            } else {
                selectedRestaurant = restaurant.name;
                selectRestaurantCard(this);
                setTimeout(showTimeStep, 500);
            }
        });
        
        restaurantGrid.appendChild(restaurantCard);
    });
}

function handleCustomRestaurant() {
    const customName = prompt("Enter your favourite restaurant name 💕:", "");
    if (customName && customName.trim()) {
        selectedRestaurant = customName.trim();
        
        // Update the selected card visually
        const customCard = document.querySelector('.restaurant-card.custom');
        if (customCard) {
            customCard.querySelector('h4').textContent = selectedRestaurant;
            selectRestaurantCard(customCard);
        }
        
        setTimeout(showTimeStep, 500);
    }
}

function selectRestaurantCard(selectedCard) {
    document.querySelectorAll('.restaurant-card').forEach(card => {
        card.classList.remove('selected');
    });
    selectedCard.classList.add('selected');
}

function showTimeStep() {
    document.getElementById('restaurantStep').classList.add('hidden');
    document.getElementById('timeStep').classList.remove('hidden');
}

async function confirmNewDate() {
    const dateInput = document.getElementById('dateInput').value;
    const timeInput = document.getElementById('timeInput').value;
    
    if (!dateInput || !timeInput) {
        showErrorMessage("Please select both date and time! 💕");
        return;
    }
    
    if (!selectedLocation || !selectedRestaurant) {
        showErrorMessage("Please select location and restaurant! 💕");
        return;
    }
    
    showLoadingOverlay("Planning our special date...");
    
    try {
        // Check if Firebase is initialized
        if (!firebase || !db || !upcomingDatesCollection) {
            throw new Error("Firebase not initialized properly");
        }
        
        // Create new date object for Firestore
        const newDate = {
            location: selectedLocation,
            restaurant: selectedRestaurant,
            date: dateInput,
            time: timeInput,
            created: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log("Attempting to save date:", newDate);
        
        // Add to Firestore - the listeners will update the local data
        const docRef = await upcomingDatesCollection.add(newDate);
        console.log("New date added with ID: ", docRef.id);
        
        showSuccessMessage("Date planned successfully! Can't wait! 💖");
        setTimeout(() => {
            showDashboard();
            updateCountdownCard();
        }, 1500);
    } catch (error) {
        console.error("Error adding new date: ", error);
        let errorMessage = "Couldn't save our date! 💔";
        
        if (error.code === 'permission-denied') {
            errorMessage = "Permission denied! Check Firestore rules 🔐";
        } else if (error.code === 'unavailable') {
            errorMessage = "Firebase is unavailable! Check internet connection 📶";
        } else if (error.message.includes('Firebase not initialized')) {
            errorMessage = "Firebase not ready yet! Wait a moment and try again ⏰";
        }
        
        showErrorMessage(errorMessage + " Try again?");
    } finally {
        hideLoadingOverlay();
    }
}

// ===== COUNTDOWN FUNCTIONALITY =====
let countdownInterval; // To store the interval for the countdown timer

function updateCountdownCard() {
    const countdownContent = document.getElementById('countdownContent');
    
    // Clear any existing countdown interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    if (firebaseData.upcomingDates.length === 0) {
        countdownContent.innerHTML = `
            <p class="no-dates">No upcoming dates planned 🥺</p>
            <p class="plan-suggestion">Let's plan something romantic! 💕</p>
        `;
        return;
    }
    
    // Find the nearest upcoming date
    const now = new Date();
    const upcomingDates = firebaseData.upcomingDates
        .filter(date => new Date(date.date + 'T' + date.time) > now)
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    
    if (upcomingDates.length === 0) {
        countdownContent.innerHTML = `
            <p class="no-dates">No upcoming dates planned 🥺</p>
            <p class="plan-suggestion">Let's plan something romantic! 💕</p>
        `;
        return;
    }
    
    const nextDate = upcomingDates[0];
    const targetDate = new Date(nextDate.date + 'T' + nextDate.time);
    
    countdownContent.innerHTML = `
        <div class="countdown-display clickable-countdown" data-date-id="${nextDate.id}">
            <h4>📍 ${capitalizeFirst(nextDate.location)} - ${nextDate.restaurant}</h4>
            <p>⏰ ${formatDateTime(nextDate.date, nextDate.time)}</p>
            <div class="countdown-timer" id="countdownTimer">
                <!-- Timer will be populated by updateTimer -->
            </div>
            <div class="click-hint">
                <i class="fas fa-info-circle"></i>
                <span>Click for details</span>
            </div>
        </div>
    `;
    
    // Add click event listener to the countdown display
    const clickableCountdown = document.querySelector('.clickable-countdown');
    if (clickableCountdown) {
        clickableCountdown.addEventListener('click', () => {
            showDateDetailsModal(nextDate.id);
        });
    }
    
    // Start countdown timer with real-time updates
    updateTimer(targetDate);
    countdownInterval = setInterval(() => updateTimer(targetDate), 1000);
}

function updateTimer(targetDate) {
    const now = new Date();
    const difference = targetDate - now;
    
    if (difference <= 0) {
        // Date has passed, move to history
        moveExpiredDatesToHistory();
        updateCountdownCard();
        return;
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    const timerElement = document.getElementById('countdownTimer');
    if (timerElement) {
        timerElement.innerHTML = `
            <div class="time-unit">
                <span class="time-number">${days}</span>
                <span class="time-label">Days</span>
            </div>
            <div class="time-unit">
                <span class="time-number">${hours}</span>
                <span class="time-label">Hours</span>
            </div>
            <div class="time-unit">
                <span class="time-number">${minutes}</span>
                <span class="time-label">Mins</span>
            </div>
            <div class="time-unit">
                <span class="time-number">${seconds}</span>
                <span class="time-label">Secs</span>
            </div>
        `;
    }
}

async function moveExpiredDatesToHistory() {
    try {
        const now = new Date();
        const expiredDates = firebaseData.upcomingDates.filter(date => 
            new Date(date.date + 'T' + date.time) <= now
        );
        
        // Process each expired date
        for (const date of expiredDates) {
            // Add to history collection
            await dateHistoryCollection.add({
                location: date.location,
                restaurant: date.restaurant,
                date: date.date,
                time: date.time,
                created: date.created,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Remove from upcoming dates collection
            await upcomingDatesCollection.doc(date.id).delete();
        }
        
        console.log(`Moved ${expiredDates.length} expired dates to history`);
    } catch (error) {
        console.error("Error moving expired dates to history:", error);
    }
}

// ===== HISTORY PAGE =====
function showHistoryPage() {
    hideAllPages();
    document.getElementById('historyPage').classList.remove('hidden');
    populateHistory();
}

function populateHistory() {
    const historyList = document.getElementById('historyList');
    
    if (firebaseData.dateHistory.length === 0) {
        historyList.innerHTML = `
            <div class="history-item">
                <div class="history-content">
                    <h3>No memories yet! 🥺</h3>
                    <p>Start planning dates to create beautiful memories together 💕</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    const sortedHistory = firebaseData.dateHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    historyList.innerHTML = sortedHistory.map(date => `
        <div class="history-item">
            <div class="history-date">${formatDate(date.date)} at ${date.time}</div>
            <div class="history-location">${capitalizeFirst(date.location)}</div>
            <div class="history-restaurant">${date.restaurant}</div>
            <div class="history-memory">A beautiful moment we shared together 💕</div>
        </div>
    `).join('');
}

// ===== GALLERY FUNCTIONALITY =====
function showGalleryPage() {
    hideAllPages();
    document.getElementById('galleryPage').classList.remove('hidden');
    
    if (isGalleryUnlocked) {
        showGalleryContent();
    } else {
        showPasswordForm();
    }
}

function showPasswordForm() {
    document.getElementById('galleryPassword').classList.remove('hidden');
    document.getElementById('galleryContent').classList.add('hidden');
    document.getElementById('passwordError').classList.add('hidden');
}

function showGalleryContent() {
    document.getElementById('galleryPassword').classList.add('hidden');
    document.getElementById('galleryContent').classList.remove('hidden');
    populatePhotoGrid();
}

function unlockGallery() {
    const passwordInput = document.getElementById('galleryPasswordInput');
    const password = passwordInput.value;
    const errorElement = document.getElementById('passwordError');
    
    if (password === firebaseData.user.galleryPassword) {
        isGalleryUnlocked = true;
        showGalleryContent();
        showSuccessMessage("Gallery unlocked! 💖");
    } else {
        errorElement.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function populatePhotoGrid() {
    const photoGrid = document.getElementById('photoGrid');
    
    if (firebaseData.photos.length === 0) {
        photoGrid.innerHTML = `
            <div class="photo-item empty-gallery" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div class="empty-gallery-icon">📸</div>
                <h3>No photos yet!</h3>
                <p>Start adding your beautiful memories together 💕</p>
                <button class="add-first-photo-btn" onclick="addPhoto()">
                    <i class="fas fa-plus"></i> Add Your First Photo
                </button>
            </div>
        `;
        return;
    }
    
    photoGrid.innerHTML = firebaseData.photos.map(photo => `
        <div class="photo-item">
            <div class="photo-frame">
                <img src="${photo.url}" alt="${photo.caption}" loading="lazy" />
                <div class="photo-actions">
                    <button class="photo-action-btn delete-btn" onclick="deletePhoto('${photo.id}')" title="Delete photo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="photo-caption">
                <p>${photo.caption}</p>
                <span class="photo-date">${formatPhotoDate(photo.uploadedAt)}</span>
            </div>
        </div>
    `).join('');
}

// Delete photo function
async function deletePhoto(photoId) {
    const photo = firebaseData.photos.find(p => p.id === photoId);
    if (!photo) return;
    
    const confirmed = confirm(`Delete "${photo.caption}"? This action cannot be undone! 💔`);
    if (!confirmed) return;
    
    showLoadingOverlay("Removing photo...");
    
    try {
        // Delete from Firestore - the listeners will update the local data and UI
        await photosCollection.doc(photoId).delete();
        console.log("Photo deleted with ID: ", photoId);
        
        showSuccessMessage("Photo deleted! 🗑️");
    } catch (error) {
        console.error("Error deleting photo:", error);
        showErrorMessage("Couldn't delete photo! 💔");
    } finally {
        hideLoadingOverlay();
    }
}

// Format photo upload date
function formatPhotoDate(timestamp) {
    if (!timestamp) return 'Just now';
    
    // Handle Firestore timestamp or regular date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

async function addPhoto() {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showErrorMessage("Photo too large! Please choose a file under 5MB 📸");
            return;
        }
        
        showLoadingOverlay("Adding your beautiful memory...");
        
        try {
            // Convert image to base64 data URL
            const imageDataUrl = await fileToDataUrl(file);
            
            // Get caption from user
            const caption = prompt("Add a caption for this beautiful memory 💕:", `Beautiful moment ${new Date().toLocaleDateString()}`);
            if (caption === null) {
                hideLoadingOverlay();
                return; // User cancelled
            }
            
            const newPhoto = {
                url: imageDataUrl,
                caption: caption || `Beautiful moment ${new Date().toLocaleDateString()}`,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                filename: file.name,
                size: file.size
            };
            
            // Add to Firestore - the listeners will update the local data and UI
            const docRef = await photosCollection.add(newPhoto);
            console.log("New photo added with ID: ", docRef.id);
            
            showSuccessMessage("Photo added! 📸💕");
        } catch (error) {
            console.error("Error adding photo:", error);
            showErrorMessage("Couldn't save your photo! 💔");
        } finally {
            hideLoadingOverlay();
        }
    });
    
    // Trigger file selection
    fileInput.click();
}

// Helper function to convert file to data URL
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ===== RANDOM DATE POPUP =====
function showRandomDatePopup() {
    // Check if today is in the popup schedule
    const today = new Date().toISOString().split('T')[0];
    
    if (!firebaseData.popupSchedule.includes(today)) {
        return;
    }
    
    // Only show on main pages
    const activePage = document.querySelector('.page:not(.hidden)');
    if (!activePage || (!activePage.id.includes('dashboard') && !activePage.id.includes('planDate'))) {
        return;
    }
    
    popupAttempts = 0;
    showPopup();
}

function showPopup() {
    document.getElementById('datePopup').classList.remove('hidden');
}

function hidePopup() {
    document.getElementById('datePopup').classList.add('hidden');
}

function handlePopupNo() {
    popupAttempts++;
    
    if (popupAttempts >= 3) {
        hidePopup();
        return;
    }
    
    // Change the popup message based on attempts
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    
    if (popupAttempts === 1) {
        popupTitle.textContent = "Are you sure? 🥺💔";
        popupMessage.textContent = "But I really want to spend time with you... pretty please? 🥹";
    } else if (popupAttempts === 2) {
        popupTitle.textContent = "Last chance! 😭💕";
        popupMessage.textContent = "I promise it'll be the most amazing date ever! Please say yes? 🙏✨";
    }
}

// ===== FIREBASE CONNECTION TEST =====
async function testFirebaseConnection() {
    try {
        console.log("Testing Firebase connection...");
        
        // Test if Firebase is available
        if (typeof firebase === 'undefined') {
            throw new Error("Firebase SDK not loaded");
        }
        
        // Test if Firestore is available
        if (!db) {
            throw new Error("Firestore database not initialized");
        }
        
        // Test if collections are available
        if (!upcomingDatesCollection) {
            throw new Error("upcomingDatesCollection not initialized");
        }
        
        // Test basic connectivity by trying to read from Firestore
        await upcomingDatesCollection.limit(1).get();
        
        console.log("✅ Firebase connection successful!");
        return true;
    } catch (error) {
        console.error("❌ Firebase connection failed:", error);
        
        // Show setup guide if it's a permission or configuration issue
        if (error.code === 'permission-denied' || error.message.includes('not initialized')) {
            showFirestoreSetupGuide();
        }
        
        showErrorMessage("Firebase connection failed! Check browser console for setup guide 💔");
        return false;
    }
}

// ===== FIRESTORE SETUP GUIDE =====
function showFirestoreSetupGuide() {
    console.log(`
🔥 FIRESTORE SETUP GUIDE 🔥

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: "sakibandchowa"
3. Go to Firestore Database
4. Set up Security Rules (for testing, use these rules):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

5. Create these collections manually if needed:
   - upcomingDates
   - dateHistory
   - photos
   - user
   - settings

6. Make sure your internet connection is stable.

Current Firebase Config:
Project ID: sakibandchowa
Auth Domain: sakibandchowa.firebaseapp.com
    `);
    
    // Also show this to the user
    const userMessage = `
        <div style="text-align: left; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h3>🔥 Firebase Setup Needed</h3>
            <p>1. Go to <a href="https://console.firebase.google.com/" target="_blank">Firebase Console</a></p>
            <p>2. Select project: <strong>sakibandchowa</strong></p>
            <p>3. Go to <strong>Firestore Database</strong></p>
            <p>4. Set Security Rules to allow testing</p>
            <p>5. Create collections: upcomingDates, dateHistory, photos, user, settings</p>
        </div>
    `;
    
    // Show in console and as alert for now
    alert("Check browser console (F12) for Firebase setup guide!");
}

// ===== MANUAL FIREBASE DEBUGGING =====
// Add this to the window object so we can test in browser console
window.debugFirebase = {
    testConnection: testFirebaseConnection,
    showSetupGuide: showFirestoreSetupGuide,
    checkCollections: function() {
        console.log("Firebase app:", firebase.app());
        console.log("Firestore db:", db);
        console.log("Collections:", {
            upcomingDates: upcomingDatesCollection,
            dateHistory: dateHistoryCollection,
            photos: photosCollection,
            user: userCollection,
            settings: settingsCollection
        });
        console.log("Current firebaseData:", firebaseData);
    },
    addTestDate: async function() {
        try {
            const testDate = {
                location: "test",
                restaurant: "Test Restaurant",
                date: "2025-07-04",
                time: "18:00",
                created: firebase.firestore.FieldValue.serverTimestamp()
            };
            const docRef = await upcomingDatesCollection.add(testDate);
            console.log("Test date added successfully:", docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Failed to add test date:", error);
            throw error;
        }
    }
};

console.log("🔧 Firebase debugging tools added to window.debugFirebase");
console.log("Available commands:");
console.log("- window.debugFirebase.testConnection()");
console.log("- window.debugFirebase.showSetupGuide()");
console.log("- window.debugFirebase.checkCollections()");
console.log("- window.debugFirebase.addTestDate()");

// ===== VISUAL DEBUG PANEL =====
function initializeDebugPanel() {
    const debugToggle = document.getElementById('debugToggle');
    const debugPanel = document.getElementById('firebaseDebugPanel');
    const closeDebugPanel = document.getElementById('closeDebugPanel');
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    const addTestDateBtn = document.getElementById('addTestDateBtn');
    const showSetupGuideBtn = document.getElementById('showSetupGuideBtn');
    const debugOutput = document.getElementById('debugOutput');
    
    // Toggle debug panel
    debugToggle.addEventListener('click', () => {
        debugPanel.classList.toggle('hidden');
        if (!debugPanel.classList.contains('hidden')) {
            updateDebugStatus();
        }
    });
    
    // Close debug panel
    closeDebugPanel.addEventListener('click', () => {
        debugPanel.classList.add('hidden');
    });
    
    // Test connection button
    testConnectionBtn.addEventListener('click', async () => {
        appendToDebugOutput('Testing Firebase connection...\n');
        const success = await testFirebaseConnection();
        appendToDebugOutput(success ? '✅ Connection successful!\n' : '❌ Connection failed!\n');
        updateDebugStatus();
    });
    
    // Add test date button
    addTestDateBtn.addEventListener('click', async () => {
        appendToDebugOutput('Adding test date...\n');
        try {
            const testDate = {
                location: "test",
                restaurant: "Debug Test Restaurant",
                date: "2025-07-04",
                time: "18:00",
                created: firebase.firestore.FieldValue.serverTimestamp()
            };
            const docRef = await upcomingDatesCollection.add(testDate);
            appendToDebugOutput(`✅ Test date added with ID: ${docRef.id}\n`);
        } catch (error) {
            appendToDebugOutput(`❌ Failed to add test date: ${error.message}\n`);
        }
    });
    
    // Show setup guide button
    showSetupGuideBtn.addEventListener('click', () => {
        appendToDebugOutput('\n🔥 FIRESTORE SETUP GUIDE:\n\n');
        appendToDebugOutput('1. Go to: https://console.firebase.google.com/\n');
        appendToDebugOutput('2. Select project: sakibandchowa\n');
        appendToDebugOutput('3. Go to Firestore Database\n');
        appendToDebugOutput('4. Set Security Rules (for testing):\n\n');
        appendToDebugOutput('rules_version = "2";\n');
        appendToDebugOutput('service cloud.firestore {\n');
        appendToDebugOutput('  match /databases/{database}/documents {\n');
        appendToDebugOutput('    match /{document=**} {\n');
        appendToDebugOutput('      allow read, write: if true;\n');
        appendToDebugOutput('    }\n');
        appendToDebugOutput('  }\n');
        appendToDebugOutput('}\n\n');
        appendToDebugOutput('5. Create collections if needed:\n');
        appendToDebugOutput('   - upcomingDates\n   - dateHistory\n   - photos\n   - user\n   - settings\n\n');
    });
}

function updateDebugStatus() {
    const connectionStatus = document.getElementById('connectionStatus');
    const dbStatus = document.getElementById('dbStatus');
    
    // Check Firebase connection
    if (typeof firebase === 'undefined') {
        setStatusValue(connectionStatus, 'No Firebase SDK', 'error');
        setStatusValue(dbStatus, 'Not Available', 'error');
        return;
    }
    
    if (!db) {
        setStatusValue(connectionStatus, 'SDK Loaded', 'success');
        setStatusValue(dbStatus, 'Not Initialized', 'error');
        return;
    }
    
    setStatusValue(connectionStatus, 'Connected', 'success');
    setStatusValue(dbStatus, 'Ready', 'success');
}

function setStatusValue(element, text, type) {
    element.textContent = text;
    element.className = `status-value ${type}`;
}

function appendToDebugOutput(text) {
    const debugOutput = document.getElementById('debugOutput');
    debugOutput.textContent += text;
    debugOutput.scrollTop = debugOutput.scrollHeight;
}

// ===== DATE DETAILS MODAL =====
let currentDateId = null;
let modalCountdownInterval = null;

function showDateDetailsModal(dateId) {
    const date = firebaseData.upcomingDates.find(d => d.id === dateId);
    if (!date) return;
    
    currentDateId = dateId;
    
    // Populate modal with date information
    document.getElementById('detailLocation').textContent = capitalizeFirst(date.location);
    document.getElementById('detailRestaurant').textContent = date.restaurant;
    document.getElementById('detailDate').textContent = formatDate(date.date);
    document.getElementById('detailTime').textContent = formatTime(date.time);
    
    // Set location icon based on location
    const locationIcon = document.querySelector('.location-icon-large');
    const locationIcons = {
        'dhanmondi': '🏞️',
        'uttara': '🌆',
        'mirpur': '🌃'
    };
    locationIcon.textContent = locationIcons[date.location] || '📍';
    
    // Start countdown for modal
    const targetDate = new Date(date.date + 'T' + date.time);
    updateModalCountdown(targetDate);
    modalCountdownInterval = setInterval(() => updateModalCountdown(targetDate), 1000);
    
    // Show modal
    document.getElementById('dateDetailsModal').classList.remove('hidden');
}

function updateModalCountdown(targetDate) {
    const now = new Date();
    const difference = targetDate - now;
    
    if (difference <= 0) {
        const timerElement = document.getElementById('modalCountdownTimer');
        if (timerElement) {
            timerElement.innerHTML = '<div class="time-unit"><span class="time-number">💕</span><span class="time-label">Date Time!</span></div>';
        }
        return;
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    const timerElement = document.getElementById('modalCountdownTimer');
    if (timerElement) {
        timerElement.innerHTML = `
            <div class="time-unit">
                <span class="time-number">${days}</span>
                <span class="time-label">Days</span>
            </div>
            <div class="time-unit">
                <span class="time-number">${hours}</span>
                <span class="time-label">Hours</span>
            </div>
            <div class="time-unit">
                <span class="time-number">${minutes}</span>
                <span class="time-label">Mins</span>
            </div>
            <div class="time-unit">
                <span class="time-number">${seconds}</span>
                <span class="time-label">Secs</span>
            </div>
        `;
    }
}

function closeDateDetailsModal() {
    document.getElementById('dateDetailsModal').classList.add('hidden');
    currentDateId = null;
    
    // Clear modal countdown interval
    if (modalCountdownInterval) {
        clearInterval(modalCountdownInterval);
        modalCountdownInterval = null;
    }
}

function showDeleteConfirmation() {
    document.getElementById('deleteConfirmModal').classList.remove('hidden');
}

function closeDeleteConfirmation() {
    document.getElementById('deleteConfirmModal').classList.add('hidden');
}

async function deleteCurrentDate() {
    if (!currentDateId) return;
    
    try {
        showLoadingOverlay("Deleting our date... 💔");
        
        // Delete from Firestore
        await upcomingDatesCollection.doc(currentDateId).delete();
        
        // Close all modals
        closeDeleteConfirmation();
        closeDateDetailsModal();
        
        // Update countdown card
        updateCountdownCard();
        
        showSuccessMessage("Date deleted successfully 💔");
    } catch (error) {
        console.error("Error deleting date:", error);
        showErrorMessage("Couldn't delete the date! 💔 Try again?");
    } finally {
        hideLoadingOverlay();
    }
}

// Add event listeners for modal functionality
function initializeDateDetailsModal() {
    // Close modal buttons
    document.getElementById('closeDateDetails').addEventListener('click', closeDateDetailsModal);
    
    // Delete button in modal
    document.getElementById('deleteDateBtn').addEventListener('click', showDeleteConfirmation);
    
    // Delete confirmation modal buttons
    document.getElementById('cancelDelete').addEventListener('click', closeDeleteConfirmation);
    document.getElementById('confirmDelete').addEventListener('click', deleteCurrentDate);
    
    // Edit button (for future implementation)
    document.getElementById('editDateBtn').addEventListener('click', () => {
        // Close modal and show plan page with current date data
        closeDateDetailsModal();
        showSuccessMessage("Edit functionality coming soon! 💕");
    });
    
    // Close modal when clicking outside
    document.getElementById('dateDetailsModal').addEventListener('click', (e) => {
        if (e.target.id === 'dateDetailsModal') {
            closeDateDetailsModal();
        }
    });
    
    document.getElementById('deleteConfirmModal').addEventListener('click', (e) => {
        if (e.target.id === 'deleteConfirmModal') {
            closeDeleteConfirmation();
        }
    });
}

// ===== BUTTON FUNCTIONALITY ENSURANCE =====
// Ensure the Let's Go button works regardless of other initialization issues
(function() {
    function setupLetsGoButton() {
        const letsGoBtn = document.getElementById('letsGoBtn');
        if (letsGoBtn) {
            console.log('Setting up Let\'s Go button...');
            
            // Clear any existing listeners
            letsGoBtn.onclick = null;
            
            // Add new listener
            letsGoBtn.addEventListener('click', function(e) {
                console.log('Let\'s Go button clicked!');
                e.preventDefault();
                e.stopPropagation();
                
                try {
                    // Simple transition to dashboard
                    const homepage = document.getElementById('customAnimationPage');
                    const dashboard = document.getElementById('dashboard');
                    
                    if (homepage && dashboard) {
                        homepage.classList.add('hidden');
                        dashboard.classList.remove('hidden');
                        
                        // Trigger dashboard animation
                        setTimeout(() => {
                            dashboard.classList.add('active');
                            
                            // Trigger card animations
                            const cards = dashboard.querySelectorAll('.animated-card');
                            cards.forEach((card, index) => {
                                card.style.animationDelay = `${0.1 + (index * 0.1)}s`;
                                card.classList.add('animate-in');
                            });
                        }, 50);
                        
                        // Try to update countdown if function exists
                        if (typeof updateCountdownCard === 'function') {
                            updateCountdownCard();
                        }
                    }
                } catch (error) {
                    console.error('Error transitioning to dashboard:', error);
                    // Fallback - just show dashboard
                    document.getElementById('customAnimationPage').style.display = 'none';
                    document.getElementById('dashboard').style.display = 'block';
                }
            });
            
            console.log('Let\'s Go button setup complete!');
        } else {
            console.error('letsGoBtn not found!');
        }
    }
    
    // Try to setup immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupLetsGoButton);
    } else {
        setupLetsGoButton();
    }
    
    // Also try after a short delay as backup
    setTimeout(setupLetsGoButton, 100);
})();
