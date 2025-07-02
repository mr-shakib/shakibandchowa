// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVQggm5tBLsqcnZqkfT5-ACHuP0KDvES0",
  authDomain: "sakibandchowa.firebaseapp.com",
  projectId: "sakibandchowa",
  storageBucket: "sakibandchowa.firebasestorage.app",
  messagingSenderId: "534107793725",
  appId: "1:534107793725:web:380fac4e470ed9dcb47d54"
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

// Enable offline persistence for Firestore
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.log('The current browser does not support all of the features required to enable persistence');
    }
  });

// Collection references
const userCollection = db.collection('user');
const upcomingDatesCollection = db.collection('upcomingDates');
const dateHistoryCollection = db.collection('dateHistory');
const photosCollection = db.collection('photos');
const settingsCollection = db.collection('settings');
