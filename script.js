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
        { 
            name: "The Westside Cafe", 
            type: "Cozy & Romantic 💕", 
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.8,
            price: "$$",
            time: "10 AM - 10 PM"
        },
        { 
            name: "Holey Artisan Bakery", 
            type: "Sweet Treats & Coffee ☕",
            image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", 
            rating: 4.6,
            price: "$$",
            time: "8 AM - 9 PM"
        },
        { 
            name: "Gloria Jean's", 
            type: "Coffee & Conversations 💬", 
            image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.5,
            price: "$$",
            time: "9 AM - 11 PM"
        },
        { 
            name: "North End Coffee Roasters", 
            type: "Artisan Coffee ☕", 
            image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.7,
            price: "$$",
            time: "7 AM - 9 PM"
        },
        { 
            name: "Cafe Mango", 
            type: "Tropical Vibes 🥭", 
            image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.4,
            price: "$",
            time: "11 AM - 10 PM"
        }
    ],
    uttara: [
        { 
            name: "Chillox", 
            type: "Modern & Trendy 🌟", 
            image: "https://images.unsplash.com/photo-1554306274-f23873d9a26c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.3,
            price: "$$",
            time: "12 PM - 11 PM"
        },
        { 
            name: "Pizza Hut", 
            type: "Comfort Food 🍕", 
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.2,
            price: "$$",
            time: "11 AM - 10:30 PM"
        },
        { 
            name: "KFC", 
            type: "Quick & Tasty 🍗", 
            image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.1,
            price: "$$",
            time: "10 AM - 11 PM"
        },
        { 
            name: "Sugandha", 
            type: "Local Flavors 🍛", 
            image: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.6,
            price: "$$",
            time: "11 AM - 10 PM"
        },
        { 
            name: "Dhaba Express", 
            type: "Authentic Taste 🍜", 
            image: "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.4,
            price: "$",
            time: "11 AM - 11 PM"
        }
    ],
    mirpur: [
        { 
            name: "Sultan's Dine", 
            type: "Traditional Elegance 👑", 
            image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.9,
            price: "$$$",
            time: "12 PM - 10:30 PM"
        },
        { 
            name: "Kacchi Bhai", 
            type: "Local Specialties 🍚", 
            image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.7,
            price: "$$",
            time: "11 AM - 10 PM"
        },
        { 
            name: "Foodpanda Kitchen", 
            type: "Variety & Convenience 🥘", 
            image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.2,
            price: "$$",
            time: "10 AM - 9 PM"
        },
        { 
            name: "Bhoj Restaurant", 
            type: "Homestyle Cooking 🏠", 
            image: "https://images.unsplash.com/photo-1596649299486-4cdea56fd59d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.5,
            price: "$",
            time: "11 AM - 10 PM"
        },
        { 
            name: "Star Kabab", 
            type: "Grilled Perfection 🔥", 
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            rating: 4.6,
            price: "$$",
            time: "12 PM - 11 PM"
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
    showLoadingScreen();
    
    // Initialize debug panel
    initializeDebugPanel();
    
    try {
        // Wait a moment for Firebase to fully initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test Firebase connection first
        const firebaseConnected = await testFirebaseConnection();
        
        if (firebaseConnected) {
            // Load data from Firebase
            await loadFirebaseData();
            
            // Set up real-time listeners for data changes
            setupRealTimeListeners();
        } else {
            console.warn("Falling back to local storage mode");
        }
        
        // Initialize UI
        checkFriendshipDay();
        initializeEventListeners();
        initializeDateDetailsModal();
        updateCountdownCard();
        
        // Show popup after 5 seconds if on main pages
        setTimeout(showRandomDatePopup, 5000);
    } catch (error) {
        console.error("Initialization error:", error);
        showErrorMessage("Something went wrong! 💔 Please try refreshing the page.");
    } finally {
        hideLoadingScreen();
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

function checkFriendshipDay() {
    const today = new Date();
    const isJuly3rd = today.getMonth() === 6 && today.getDate() === 3; // July is month 6 (0-indexed)
    
    if (isJuly3rd) {
        showFriendshipDayPage();
    } else {
        showDashboard();
    }
}

function showFriendshipDayPage() {
    hideAllPages();
    document.getElementById('friendshipDayPage').classList.remove('hidden');
}

function showDashboard() {
    hideAllPages();
    document.getElementById('dashboard').classList.remove('hidden');
    updateCountdownCard();
}

function hideAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add('hidden'));
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // Friendship Day enter button
    document.getElementById('enterDashboard').addEventListener('click', showDashboard);
    
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
        
        // Generate star rating HTML
        let starsHTML = '';
        const fullStars = Math.floor(restaurant.rating);
        const halfStar = restaurant.rating % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && halfStar) {
                starsHTML += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        
        restaurantCard.innerHTML = `
            <img src="${restaurant.image}" alt="${restaurant.name}" class="restaurant-image">
            <div class="restaurant-details">
                <h4>${restaurant.name}</h4>
                <p>${restaurant.type}</p>
                <div class="restaurant-rating">
                    ${starsHTML} 
                    <span style="margin-left:5px">${restaurant.rating}</span>
                </div>
                <div class="restaurant-info">
                    <span><i class="fas fa-dollar-sign"></i> ${restaurant.price}</span>
                    <span><i class="fas fa-clock"></i> ${restaurant.time}</span>
                </div>
            </div>
        `;
        
        restaurantCard.addEventListener('click', function() {
            selectedRestaurant = restaurant.name;
            selectRestaurantCard(this);
            setTimeout(showTimeStep, 500);
        });
        
        restaurantGrid.appendChild(restaurantCard);
    });
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
            <div class="photo-item" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p>No photos yet! 📸</p>
                <p>Start adding your beautiful memories together 💕</p>
            </div>
        `;
        return;
    }
    
    photoGrid.innerHTML = firebaseData.photos.map(photo => `
        <div class="photo-item">
            <img src="${photo.url}" alt="${photo.caption}" />
            <div class="photo-info">
                <p>${photo.caption}</p>
            </div>
        </div>
    `).join('');
}

async function addPhoto() {
    showLoadingOverlay("Adding your beautiful memory...");
    
    try {
        // For demo purposes, we'll add a placeholder photo
        // In a real app, this would open a file picker and upload to Firebase Storage
        const newPhoto = {
            url: `https://picsum.photos/300/200?random=${Date.now()}`,
            caption: `Beautiful moment ${new Date().toLocaleDateString()}`,
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
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

// ===== UTILITY FUNCTIONS =====
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatDateTime(dateString, timeString) {
    const date = new Date(dateString);
    const [hours, minutes] = timeString.split(':');
    
    const dateFormat = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
    
    const timeFormat = new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    
    return `${dateFormat} at ${timeFormat}`;
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date(2000, 0, 1, hours, minutes);
    
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function showSuccessMessage(message) {
    const successElement = document.getElementById('successMessage');
    successElement.querySelector('span').textContent = message;
    successElement.classList.remove('hidden');
    
    setTimeout(() => {
        successElement.classList.add('hidden');
    }, 3000);
}

function showErrorMessage(message) {
    // For simplicity, using alert. In a real app, you'd create a proper error message component
    alert(message);
}

// ===== DEMO DATA (for testing) =====
function addDemoData() {
    // Add some demo dates for testing
    firebaseData.dateHistory.push(
        {
            id: 1,
            location: "dhanmondi",
            restaurant: "The Westside Cafe",
            date: "2025-06-15",
            time: "19:00",
            completedAt: "2025-06-15T19:00:00Z"
        },
        {
            id: 2,
            location: "uttara",
            restaurant: "Chillox",
            date: "2025-06-01",
            time: "18:30",
            completedAt: "2025-06-01T18:30:00Z"
        }
    );
    
    // Add some demo photos
    firebaseData.photos.push(
        {
            id: 1,
            url: "https://picsum.photos/300/200?random=1",
            caption: "Our first date at the lake 💕",
            uploadedAt: "2025-06-15T19:30:00Z"
        },
        {
            id: 2,
            url: "https://picsum.photos/300/200?random=2",
            caption: "Sunset dinner together ✨",
            uploadedAt: "2025-06-01T19:00:00Z"
        },
        {
            id: 3,
            url: "https://picsum.photos/300/200?random=3",
            caption: "Coffee and giggles ☕",
            uploadedAt: "2025-05-20T16:00:00Z"
        }
    );
    
    saveFirebaseData();
}

// Uncomment the line below to add demo data for testing
// addDemoData();
