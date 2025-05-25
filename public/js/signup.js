import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

// Firebase 구성
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

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM 요소
const signupForm = document.getElementById('signupForm');
const passwordInput = document.getElementById('signupPassword');
const passwordConfirmInput = document.getElementById('signupPasswordConfirm');

// 스타일 추가
const style = document.createElement('style');
style.textContent = `
.alert-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.alert-box {
    background-color: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 90%;
    width: 400px;
}

.alert-box.success {
    border-top: 4px solid #2ecc71;
}

.alert-box.error {
    border-top: 4px solid #e74c3c;
}

.alert-message {
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
    color: #2c3e50;
}

.alert-button {
    padding: 0.8rem 2rem;
    border: none;
    border-radius: 5px;
    background-color: #3498db;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
}

.alert-button:hover {
    background-color: #2980b9;
}
`;
document.head.appendChild(style);

// 비밀번호 유효성 검사 함수
function validatePassword(password) {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    const errors = [];
    if (!minLength) errors.push('비밀번호는 최소 6자 이상이어야 합니다.');
    if (!hasUpperCase) errors.push('대문자를 포함해야 합니다.');
    if (!hasLowerCase) errors.push('소문자를 포함해야 합니다.');
    if (!hasNumber) errors.push('숫자를 포함해야 합니다.');
    if (!hasSpecialChar) errors.push('특수문자(!@#$%^&*)를 포함해야 합니다.');

    return {
        isValid: errors.length === 0,
        errors
    };
}

// 회원가입 폼 제출 처리
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('signupEmail').value;
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;
    const nickname = document.getElementById('nickname').value;

    // 비밀번호 확인
    if (password !== passwordConfirm) {
        showAlert('비밀번호가 일치하지 않습니다.', 'error');
        return;
    }

    // 비밀번호 유효성 검사
    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
        showAlert('비밀번호 요구사항을 확인해주세요:\n' + errors.join('\n'), 'error');
        return;
    }

    try {
        // Firebase에 사용자 생성
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 닉네임 설정
        await updateProfile(userCredential.user, {
            displayName: nickname
        });

        showAlert('회원가입이 완료되었습니다!', 'success', () => {
            window.location.href = 'index.html';
        });
    } catch (error) {
        let errorMessage = '회원가입 중 오류가 발생했습니다.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = '이미 사용 중인 이메일 주소입니다.';
                break;
            case 'auth/invalid-email':
                errorMessage = '유효하지 않은 이메일 주소입니다.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = '이메일/비밀번호 회원가입이 비활성화되어 있습니다.';
                break;
            case 'auth/weak-password':
                errorMessage = '보안에 취약한 비밀번호입니다.';
                break;
        }
        
        showAlert(errorMessage, 'error');
    }
});

// 중앙 알림창 표시 함수
function showAlert(message, type = 'success', callback = null) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    
    const alertBox = document.createElement('div');
    alertBox.className = `alert-box ${type}`;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'alert-message';
    messageElement.textContent = message;
    
    const button = document.createElement('button');
    button.className = 'alert-button';
    button.textContent = '확인';
    
    button.onclick = () => {
        overlay.remove();
        if (callback) callback();
    };
    
    alertBox.appendChild(messageElement);
    alertBox.appendChild(button);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
} 