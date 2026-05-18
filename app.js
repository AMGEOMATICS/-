import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCmGYoMqvaTDafiHb7q9Vk7vE4n1w2tWBI",
  authDomain: "am-a-geo.firebaseapp.com",
  projectId: "am-a-geo",
  storageBucket: "am-a-geo.firebasestorage.app",
  messagingSenderId: "724200458201",
  appId: "1:724200458201:web:14f851dbaf89d49170bbc8",
  measurementId: "G-XSVLE7P0V6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "refathany2005@gmail.com"; // خليناها حروف صغيرة كمرجع
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('login-btn-nav');
    const logoutBtn = document.getElementById('logout-btn-nav');
    
    if (user) {
        currentUser = user;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        closeModal('login-modal');
    } else {
        currentUser = null;
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
    }
    loadData('projects', 'data-list');
    loadData('courses', 'courses-list');
    loadData('sites', 'sites-list');
});

window.registerUser = async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        alert("تم إنشاء الحساب بنجاح!");
    } catch (error) {
        alert("حصل مشكلة: " + error.message);
    }
};

window.loginUser = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        alert("تم تسجيل الدخول!");
    } catch (error) {
        alert("الإيميل أو الباسورد غلط!");
    }
};

window.logoutUser = async () => {
    await signOut(auth);
    alert("تم تسجيل الخروج");
};

window.saveDataProject = async () => {
    if(!currentUser) return alert("لازم تسجل دخول الأول عشان تنشر بيانات!");
    const title = document.getElementById('data-title').value;
    const format = document.getElementById('data-format').value;
    const date = document.getElementById('data-date').value;
    const details = document.getElementById('data-details').value;
    const link = document.getElementById('data-link').value;
    const errorMsg = document.getElementById('drive-error');

    if (!link.includes("drive.google.com")) {
        errorMsg.style.display = 'block';
        return;
    }
    errorMsg.style.display = 'none';

    await addDoc(collection(db, "projects"), {
        title, format, date, details, link, publisher: currentUser.email
    });
    alert("تم نشر المشروع!");
    closeModal('create-data-modal');
};

window.saveCourse = async () => {
    if(!currentUser) return alert("لازم تسجل دخول الأول!");
    const title = document.getElementById('course-title').value;
    const details = document.getElementById('course-details').value;
    const link = document.getElementById('course-link').value;
    const errorMsg = document.getElementById('youtube-error');

    if (!link.includes("youtube.com") && !link.includes("youtu.be")) {
        errorMsg.style.display = 'block';
        return;
    }
    errorMsg.style.display = 'none';

    await addDoc(collection(db, "courses"), {
        title, details, link, publisher: currentUser.email
    });
    alert("تم نشر الدورة!");
    closeModal('create-course-modal');
};

window.saveSite = async () => {
    if(!currentUser) return alert("لازم تسجل دخول الأول!");
    const title = document.getElementById('site-title').value;
    const details = document.getElementById('site-details').value;
    const link = document.getElementById('site-link').value;

    await addDoc(collection(db, "sites"), {
        title, details, link, publisher: currentUser.email
    });
    alert("تم نشر الموقع!");
    closeModal('create-site-modal');
};

function loadData(collectionName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    onSnapshot(collection(db, collectionName), (snapshot) => {
        container.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // هنا ظبطنا المشكلة: بنحول الإيميلين لحروف صغيرة عشان يتطابقوا دايماً
            const isAdmin = currentUser && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            const deleteBtnHtml = isAdmin ? `<button class="delete-btn" onclick="deleteItem('${collectionName}', '${id}')">مسح 🗑️</button>` : '';

            const card = document.createElement('div');
            card.className = 'data-card';
            card.innerHTML = `
                ${deleteBtnHtml}
                <h3>${data.title}</h3>
                ${data.format ? `<p><strong>الصيغة:</strong> ${data.format}</p>` : ''}
                ${data.date ? `<p><strong>التاريخ:</strong> ${data.date}</p>` : ''}
                <p>${data.details || 'لا توجد تفاصيل إضافية.'}</p>
                <p><small>الناشر: ${data.publisher}</small></p>
                <a href="${data.link}" target="_blank">فتح الرابط</a>
            `;
            container.appendChild(card);
        });
    });
}

window.deleteItem = async (collectionName, id) => {
    if(confirm("متأكد إنك عايز تمسح البوست ده؟")) {
        await deleteDoc(doc(db, collectionName, id));
    }
};

// --- دالة محرك البحث اللحظي (الاقتراحات) ---
window.filterSearch = (inputId, listId) => {
    const input = document.getElementById(inputId).value.toLowerCase();
    const cards = document.getElementById(listId).getElementsByClassName('data-card');

    // بيلف على كل الكروت ويخفي اللي مش مطابق لكلامك
    for (let i = 0; i < cards.length; i++) {
        const cardText = cards[i].innerText.toLowerCase();
        if (cardText.includes(input)) {
            cards[i].style.display = "block";
        } else {
            cards[i].style.display = "none";
        }
    }
};

window.showPage = (pageId, linkElement) => {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (linkElement) linkElement.classList.add('active');
};

window.toggleTheme = () => {
    const body = document.body;
    const themeBtn = document.getElementById('theme-btn');
    const logo = document.getElementById('site-logo');
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        themeBtn.innerHTML = '☀️ لايت مود';
        themeBtn.style.color = '#ffffff';
        themeBtn.style.borderColor = '#ffffff';
        logo.src = 'AM (1).png'; 
    } else {
        themeBtn.innerHTML = '🌙 دارك مود';
        themeBtn.style.color = '#111111';
        themeBtn.style.borderColor = '#111111';
        logo.src = 'AM.png'; 
    }
};

window.openModal = (modalId) => { document.getElementById(modalId).style.display = 'block'; };
window.closeModal = (modalId) => { document.getElementById(modalId).style.display = 'none'; };
window.switchAuthTab = (tab) => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => t.classList.remove('active'));
    if (tab === 'login') {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active'); 
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        tabs[1].classList.add('active'); 
    }
};
