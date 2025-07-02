# 💕 Couple Date Planner

A beautiful, romantic couple date planner website with real-time Firebase integration and stunning animations.

## ✨ Features

- 🌟 **Beautiful Welcome Screen** - Special Anniversary Month theme
- 💖 **Real-time Countdown** - Live countdown to your next date
- 📱 **Responsive Design** - Works perfectly on all devices
- 🔥 **Firebase Integration** - Real-time data storage and sync
- 📸 **Photo Gallery** - Password-protected memories
- 🗓️ **Date Planning** - Multi-step date planning interface
- 📖 **Date History** - Keep track of all your special moments
- 🎨 **Glassmorphism UI** - Modern, beautiful interface
- ⚡ **Real-time Updates** - Instant synchronization across devices

## 🚀 Live Demo

Visit the live site: [Your Vercel URL]

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Firestore
- **Styling**: Custom CSS with Glassmorphism effects
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Poppins)
- **Deployment**: Vercel

## 📁 Project Structure

```
couple-date-planner/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles and animations
├── script.js           # JavaScript functionality
├── firebase-config.js  # Firebase configuration
├── vercel.json         # Vercel deployment config
├── package.json        # Project metadata
└── README.md          # Project documentation
```

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/couple-date-planner.git
cd couple-date-planner
```

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing: `sakibandchowa`
3. Enable Firestore Database
4. Update security rules for testing:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
5. Update `firebase-config.js` with your Firebase config

### 3. Local Development
```bash
# Open index.html in your browser
# Or use a local server
npx http-server . -p 3000
```

### 4. Deploy to Vercel
1. Push to GitHub
2. Connect repository to Vercel
3. Deploy automatically

## 🔥 Firebase Collections

The app uses these Firestore collections:
- `upcomingDates` - Planned future dates
- `dateHistory` - Completed dates
- `photos` - Gallery images
- `user` - User settings (including gallery password)
- `settings` - App configuration

## 💡 Features Overview

### Date Planning
- Multi-step planning process
- Location selection (Dhanmondi, Uttara, Mirpur)
- Restaurant selection with details
- Date and time picker

### Real-time Countdown
- Live countdown timer
- Clickable date cards for details
- Automatic expiry handling

### Photo Gallery
- Password protection (`ourlove123`)
- Real-time photo sync
- Beautiful grid layout

### Debug Panel
- Built-in Firebase testing tools
- Connection status monitoring
- Setup guide integration

## 🎨 Design Features

- **Glassmorphism Effects** - Modern blur and transparency
- **Teal Color Scheme** - Romantic and modern palette
- **Smooth Animations** - CSS transitions and keyframes
- **Mobile Responsive** - Optimized for all screen sizes
- **Beautiful Typography** - Poppins font family

## 🐛 Troubleshooting

### Firebase Issues
1. Check browser console for errors
2. Use the debug panel (🔧 icon)
3. Verify Firestore security rules
4. Ensure internet connection

### Deployment Issues
1. Check `vercel.json` configuration
2. Verify all files are committed to Git
3. Check Vercel build logs

## 📝 License

MIT License - Feel free to use this project for your own romantic adventures! 💕

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 💖 Made with Love

Created for couples who want to plan beautiful dates and create lasting memories together.

---

*Happy Dating! 💕✨*
