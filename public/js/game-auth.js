import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD5KnucA7jEexHCSX9_xIfAkfevASdJ_o8",
    authDomain: "stock-healing.firebaseapp.com",
    projectId: "stock-healing",
    storageBucket: "stock-healing.firebasestorage.app",
    messagingSenderId: "659616741951",
    appId: "1:659616741951:web:781711e40088b7d1c2168a",
    databaseURL: "https://stock-healing-default-rtdb.asia-southeast1.firebasedatabase.app/",
    measurementId: "G-9Y5S3F06LH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const userProfile = document.getElementById('userProfile');
const loginBtn = document.querySelector('.login-btn');
const logoutBtn = document.getElementById('logoutBtn');

// Check Authentication State
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        showAuthenticatedUI(user);
    } else {
        // User is signed out
        showUnauthenticatedUI();
    }
});

// UI Functions
function showAuthenticatedUI(user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userProfile) {
        userProfile.style.display = 'flex';
        const displayName = user.displayName || user.email;
        if (document.getElementById('userName')) {
            document.getElementById('userName').textContent = displayName;
        }
    }
}

function showUnauthenticatedUI() {
    if (loginBtn) loginBtn.style.display = 'flex';
    if (userProfile) userProfile.style.display = 'none';
}

// Logout handler
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = '/index.html';
        } catch (error) {
            console.error('로그아웃 오류:', error);
        }
    });
} 