import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getDatabase, ref, push, onValue, set, get, remove } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js";
import { 
    getAuth, 
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

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
const analytics = getAnalytics(app);
const database = getDatabase(app);
const auth = getAuth(app);

// DOM Elements
const userProfile = document.getElementById('userProfile');
const userName = document.getElementById('userName');
const loginBtn = document.querySelector('.login-btn');
const logoutBtn = document.getElementById('logoutBtn');
const addStoryBtn = document.getElementById('add-story-btn');
const storyModal = document.getElementById('story-modal');
const closeModal = document.querySelector('.close-modal');
const storyForm = document.getElementById('story-form');
const storiesContainer = document.querySelector('.stories-timeline');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message');
const chatMessages = document.querySelector('.chat-messages');
const ctaButton = document.querySelector('.cta-button');

// 사이드바 관련 요소들
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.getElementById('sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');
let sidebarTimeout;

// 오버레이 요소 생성
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

// Check if current page is login or signup page
const isAuthPage = window.location.pathname.includes('login.html') || 
                  window.location.pathname.includes('signup.html');

// Check Authentication State
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        if (isAuthPage) {
            // If on login/signup page, redirect to main page
            window.location.href = '/index.html';
            return;
        }
        showAuthenticatedUI(user);
        loadStories();
        if (addStoryBtn) {
            addStoryBtn.style.display = 'block';
        }
    } else {
        // User is signed out
        if (!isAuthPage) {
            // If not on login/signup page, redirect to login
            window.location.href = '/login.html';
            return;
        }
        showUnauthenticatedUI();
        if (addStoryBtn) {
            addStoryBtn.style.display = 'none';
        }
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadStories();
    addMenuEventListeners();
});

function setupEventListeners() {
    // Modal controls
    if (addStoryBtn) {
        addStoryBtn.addEventListener('click', () => {
            if (!auth.currentUser) {
                window.location.href = 'login.html';
                return;
            }
            storyModal.style.display = 'block';
        });
    }

    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            if (!auth.currentUser) {
                window.location.href = 'login.html';
                return;
            }
            storyModal.style.display = 'block';
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            storyModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === storyModal) {
            storyModal.style.display = 'none';
        }
    });

    // Form submission
    if (storyForm) {
        storyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!auth.currentUser) {
                showNotification('로그인이 필요합니다.', 'error');
                return;
            }

            const title = document.getElementById('story-title').value.trim();
            const content = document.getElementById('story-content').value.trim();

            if (!title || !content) {
                showNotification('제목과 내용을 모두 입력해주세요.', 'error');
                return;
            }

            try {
                const storiesRef = ref(database, 'stories');
                await push(storiesRef, {
                    title,
                    content,
                    author: auth.currentUser.displayName || '익명',
                    userId: auth.currentUser.uid,
                    date: new Date().toISOString(),
                    likes: 0
                });

                showNotification('이야기가 성공적으로 공유되었습니다!');
                storyForm.reset();
                storyModal.style.display = 'none';
            } catch (error) {
                console.error('Error saving story:', error);
                showNotification('이야기 저장 중 오류가 발생했습니다.', 'error');
            }
        });
    }

    // Chat functionality
    if (sendMessageBtn && messageInput) {
        sendMessageBtn.addEventListener('click', handleSendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Story Functions
function loadStories() {
    const storiesRef = ref(database, 'stories');
    onValue(storiesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const storiesArray = Object.entries(data)
                .map(([key, value]) => ({ id: key, ...value }))
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            renderStories(storiesArray);
        } else {
            storiesContainer.innerHTML = '<div class="story-card"><p class="no-stories">아직 공유된 이야기가 없습니다.<br>첫 번째 이야기의 주인공이 되어보세요!</p></div>';
        }
    });
}

function renderStories(stories) {
    if (!storiesContainer) return;
    
    storiesContainer.innerHTML = stories.map(story => {
        const authorInitial = story.author.charAt(0).toUpperCase();
        const isAuthor = auth.currentUser && story.userId === auth.currentUser.uid;
        
        return `
            <div class="story-card">
                <div class="story-header">
                    <div class="story-author-avatar">${authorInitial}</div>
                    <div class="story-author-info">
                        <div class="story-author-name">${story.author}</div>
                        <div class="story-date">${formatDate(story.date)}</div>
                    </div>
                    ${isAuthor ? `<button onclick="handleDeleteStory('${story.id}')" class="delete-btn" title="삭제">×</button>` : ''}
                </div>
                <div class="story-content">
                    <div class="story-title">${story.title}</div>
                    <div class="story-text">${story.content}</div>
                </div>
                <div class="story-actions">
                    <button onclick="handleLikeStory('${story.id}')" class="like-btn">
                        👍 좋아요 ${story.likes ? `(${story.likes})` : '(0)'}
                    </button>
                    <button onclick="handleDislikeStory('${story.id}')" class="dislike-btn">
                        👎 싫어요 ${story.dislikes ? `(${story.dislikes})` : '(0)'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// UI Functions
function showAuthenticatedUI(user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userProfile) {
        userProfile.style.display = 'flex';
        if (userName) {
            userName.textContent = user.displayName || user.email;
        }
    }
    
    if (addStoryBtn) {
        addStoryBtn.disabled = false;
        addStoryBtn.textContent = '새 글 작성하기';
    }
    
    if (ctaButton) {
        ctaButton.disabled = false;
        ctaButton.textContent = '이야기 공유하기';
    }
}

function showUnauthenticatedUI() {
    if (loginBtn) loginBtn.style.display = 'block';
    if (userProfile) {
        userProfile.style.display = 'none';
        userName.textContent = '';
    }
    
    if (addStoryBtn) {
        addStoryBtn.disabled = true;
        addStoryBtn.textContent = '로그인하고 글쓰기';
    }
    
    if (ctaButton) {
        ctaButton.disabled = true;
        ctaButton.textContent = '로그인하고 이야기 공유하기';
    }
}

// Chat Functions
function handleSendMessage() {
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    if (!message) return;

    if (!auth.currentUser) {
        showNotification('로그인이 필요합니다.', 'error');
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
        <span class="message-author">${auth.currentUser.displayName || '익명'}</span>
        <p class="message-content">${message}</p>
        <span class="message-time">${new Date().toLocaleTimeString()}</span>
    `;

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    messageInput.value = '';
}

// Auth Functions
async function handleLogout() {
    try {
        await signOut(auth);
        showNotification('로그아웃되었습니다.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    } catch (error) {
        console.error('로그아웃 오류:', error);
        showNotification('로그아웃 중 오류가 발생했습니다.', 'error');
    }
}

// Helper Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return '방금 전';
    } else if (minutes < 60) {
        return `${minutes}분 전`;
    } else if (hours < 24) {
        return `${hours}시간 전`;
    } else if (days < 7) {
        return `${days}일 전`;
    } else {
        return date.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    const style = document.createElement('style');
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

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Global functions for event handlers
window.handleLikeStory = async function(storyId) {
    if (!auth.currentUser) {
        showNotification('로그인이 필요합니다.', 'error');
        return;
    }

    const storyRef = ref(database, `stories/${storyId}`);
    onValue(storyRef, (snapshot) => {
        const story = snapshot.val();
        if (story) {
            const currentLikes = story.likes || 0;
            set(storyRef, {
                ...story,
                likes: currentLikes + 1
            });
        }
    }, {
        onlyOnce: true
    });
};

window.handleDislikeStory = async function(storyId) {
    if (!auth.currentUser) {
        showNotification('로그인이 필요합니다.', 'error');
        return;
    }

    const storyRef = ref(database, `stories/${storyId}`);
    onValue(storyRef, (snapshot) => {
        const story = snapshot.val();
        if (story) {
            const currentDislikes = story.dislikes || 0;
            set(storyRef, {
                ...story,
                dislikes: currentDislikes + 1
            });
        }
    }, {
        onlyOnce: true
    });
};

// Add delete story handler
window.handleDeleteStory = async function(storyId) {
    if (!auth.currentUser) {
        showNotification('로그인이 필요합니다.', 'error');
        return;
    }

    try {
        const storyRef = ref(database, `stories/${storyId}`);
        
        // Check if user is the author
        const snapshot = await get(storyRef);
        const story = snapshot.val();
        
        if (!story || story.userId !== auth.currentUser.uid) {
            showNotification('삭제 권한이 없습니다.', 'error');
            return;
        }

        // Confirm deletion
        if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            return;
        }

        // Delete the story
        await remove(storyRef);
        showNotification('게시글이 삭제되었습니다.');
        
    } catch (error) {
        console.error('Error deleting story:', error);
        showNotification('게시글 삭제 중 오류가 발생했습니다.', 'error');
    }
};

// 명언 데이터
const quotes = [
    {
        text: "주식시장에서 돈을 벌 수 있는 가장 중요한 요소는 자기 자신을 다스리는 것이다.",
        author: "워렌 버핏"
    },
    {
        text: "다른 사람들이 탐욕스러울 때는 두려워하고, 다른 사람들이 두려워할 때는 탐욕스러워라.",
        author: "워렌 버핏"
    },
    {
        text: "투자에서 성공하기 위해서는 이성적인 판단력과 감정의 안정성이 필요하다.",
        author: "벤저민 그레이엄"
    },
    {
        text: "주식시장은 단기적으로는 투표기계이지만, 장기적으로는 저울이다.",
        author: "벤저민 그레이엄"
    },
    {
        text: "위대한 기회는 공포 속에서 태어난다.",
        author: "존 템플턴"
    },
    {
        text: "시장의 단기 변동성에 휘둘리지 마라. 장기적인 가치에 집중하라.",
        author: "피터 린치"
    },
    {
        text: "투자는 마라톤이지 단거리 경주가 아니다.",
        author: "폴 새뮤얼슨"
    },
    {
        text: "당신이 감당할 수 없는 손실을 무릅쓰고 수익을 추구하지 마라.",
        author: "워렌 버핏"
    }
];

let currentQuoteIndex = 0;
const quoteText = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');

function showQuote(index) {
    quoteText.classList.remove('active');
    quoteAuthor.classList.remove('active');
    
    setTimeout(() => {
        quoteText.textContent = quotes[index].text;
        quoteAuthor.textContent = `- ${quotes[index].author}`;
        
        quoteText.classList.add('active');
        quoteAuthor.classList.add('active');
    }, 500);
}

function rotateQuotes() {
    showQuote(currentQuoteIndex);
    currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
}

// 초기 명언 표시
showQuote(currentQuoteIndex);
// 5초마다 명언 변경
setInterval(rotateQuotes, 5000);

// 메뉴 클릭 이벤트 핸들러
function handleMenuClick(event) {
    const href = event.currentTarget.getAttribute('href');
    
    // 사이드바가 열려있다면 닫기
    if (sidebar && sidebar.classList.contains('active')) {
        closeSidebar();
    }

    // 내부 링크(#으로 시작)만 preventDefault
    if (href.startsWith('#')) {
        event.preventDefault();
        const targetId = href.substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            // 스크롤 애니메이션
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// 모든 메뉴 링크에 이벤트 리스너 추가
function addMenuEventListeners() {
    // 데스크톱 메뉴 링크
    document.querySelectorAll('.desktop-menu a').forEach(link => {
        link.addEventListener('click', handleMenuClick);
    });

    // 사이드바 메뉴 링크
    document.querySelectorAll('.sidebar .nav-links a').forEach(link => {
        link.addEventListener('click', handleMenuClick);
    });
}

// 사이드바 열기
function openSidebar() {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    resetSidebarTimer();
}

// 사이드바 닫기
function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    clearTimeout(sidebarTimeout);
}

// 사이드바 타이머 리셋
function resetSidebarTimer() {
    clearTimeout(sidebarTimeout);
    sidebarTimeout = setTimeout(() => {
        closeSidebar();
    }, 3000);
}

// 이벤트 리스너 등록
if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
if (overlay) overlay.addEventListener('click', closeSidebar);

// 사이드바 내부 움직임 감지
if (sidebar) {
    sidebar.addEventListener('mousemove', resetSidebarTimer);
    sidebar.addEventListener('touchstart', resetSidebarTimer);
    
    // 사이드바 내부 클릭 이벤트 버블링 방지
    sidebar.addEventListener('click', (e) => {
        e.stopPropagation();
    });
} 