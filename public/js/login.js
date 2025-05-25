import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

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
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    try {
        // Show loading state
        document.querySelector('button[type="submit"]').disabled = true;
        
        // Attempt to sign in
        await signInWithEmailAndPassword(auth, email, password);
        
        window.location.href = '/index.html';

        
    } catch (error) {
        console.error('Login error:', error);
        let message = '로그인에 실패했습니다.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                message = '유효하지 않은 이메일 주소입니다.';
                break;
            case 'auth/user-disabled':
                message = '계정이 비활성화되었습니다.';
                break;
            case 'auth/user-not-found':
                message = '등록되지 않은 이메일입니다.';
                break;
            case 'auth/wrong-password':
                message = '잘못된 비밀번호입니다.';
                break;
        }
        
        showNotification(message, 'error');
    } finally {
        // Re-enable submit button
        document.querySelector('button[type="submit"]').disabled = false;
    }
});

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Add styles if not already present
    if (!document.querySelector('#notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            .notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 1rem 2rem;
                border-radius: 5px;
                color: white;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            }

            .notification.success {
                background-color: #2ecc71;
            }

            .notification.error {
                background-color: #e74c3c;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        notification.remove();
    }, 3000);
} 