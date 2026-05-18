import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCmGYoMqvaTDafiHb7q9Vk7vE4n1w2tWBI",
  authDomain: "am-a-geo.firebaseapp.com",
  projectId: "am-a-geo",
  storageBucket: "am-a-geo.firebasestorage.app",
  messagingSenderId: "724200458201",
  appId: "1:724200458201:web:14f851dbaf89d49170bbc8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "refathany2005@gmail.com"; 
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('login-btn-nav');
    const logoutBtn = document.getElementById('logout-btn-nav');
    const createBtns = document.querySelectorAll('.create-btn'); 
    
    if (user) {
        currentUser = user;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        createBtns.forEach(btn => btn.style.display = 'inline-block'); 
        closeModal('login-modal');
    } else {
        currentUser = null;
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        createBtns.forEach(btn => btn.style.display = 'none'); 
    }
    loadData('projects', 'data-list');
    loadData('courses', 'courses-list');
    loadData('sites', 'sites-list');
});

window.registerUser = async () => {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    
    if(!name) return alert("اكتب اسم المستخدم الأول!");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        // تحديث وتأكيد اسم المستخدم داخل الحساب فوراً
        await updateProfile(userCredential.user, { displayName: name });
        alert("تم إنشاء الحساب بنجاح يا " + name);
        window.location.reload(); // ريفريش سريع عشان نضمن ثبات الاسم في المتصفح
    } catch (error) {
        alert("خطأ: " + error.message);
    }
};

window.loginUser = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("الإيميل أو الباسورد غلط!");
    }
};

window.logoutUser = async () => { await signOut(auth); };

window.saveDataProject = async () => {
    if(!currentUser) return;
    const title = document.getElementById('data-title').value;
    const format = document.getElementById('data-format').value;
    const date = document.getElementById('data-date').value;
    const details = document.getElementById('data-details').value;
    const link = document.getElementById('data-link').value;

    await addDoc(collection(db, "projects"), {
        title, format, date, details, link, 
        publisherName: currentUser.displayName || currentUser.email.split('@')[0], // حل ذكي لو الاسم مش مسجل يقرأ اليوزر نيم من الإيميل
        publisherEmail: currentUser.email 
    });
    alert("تم النشر بنجاح!"); closeModal('create-data-modal');
};

window.saveCourse = async () => {
    if(!currentUser) return;
    const title = document.getElementById('course-title').value;
    const details = document.getElementById('course-details').value;
    const link = document.getElementById('course-link').value;

    await addDoc(collection(db, "courses"), {
        title, details, link, 
        publisherName: currentUser.displayName || currentUser.email.split('@')[0], 
        publisherEmail: currentUser.email
    });
    alert("تم النشر بنجاح!"); closeModal('create-course-modal');
};

window.saveSite = async () => {
    if(!currentUser) return;
    const title = document.getElementById('site-title').value;
    const details = document.getElementById('site-details').value;
    const link = document.getElementById('site-link').value;

    await addDoc(collection(db, "sites"), {
        title, details, link, 
        publisherName: currentUser.displayName || currentUser.email.split('@')[0], 
        publisherEmail: currentUser.email
    });
    alert("تم النشر بنجاح!"); closeModal('create-site-modal');
};

function loadData(collectionName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    onSnapshot(collection(db, collectionName), (snapshot) => {
        container.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const isAdmin = currentUser && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            const deleteBtn = isAdmin ? `<button class="delete-btn" onclick="deleteItem('${collectionName}', '${docSnap.id}')">🗑️</button>` : '';

            // كود العرض المطور لقراءة اسم المستخدم الصريح أو الإيميل كبديل كروت قديمة
            const finalPublisher = data.publisherName || data.publisher || "مستخدم الجيوماتكس";

            const card = document.createElement('div');
            card.className = 'data-card glass-panel';
            card.innerHTML = `
                ${deleteBtn}
                <h3>${data.title}</h3>
                ${data.format ? `<p><strong>الصيغة:</strong> ${data.format}</p>` : ''}
                <p>${data.details || ''}</p>
                <p><small style="color:var(--primary-color); font-weight:bold;">الناشر: ${finalPublisher}</small></p>
                <a href="${data.link}" target="_blank" style="display:block; margin-top:10px; color:#fff; background:var(--primary-color); text-align:center; padding:8px; border-radius:8px; text-decoration:none;">فتح الرابط</a>
            `;
            container.appendChild(card);
        });
    });
}

window.deleteItem = async (col, id) => { if(confirm("أكيد هتمسح البوست ده؟")) await deleteDoc(doc(db, col, id)); };

window.filterSearch = (inputId, listId) => {
    const input = document.getElementById(inputId).value.toLowerCase();
    const container = document.getElementById(listId);
    const cards = container.getElementsByClassName('data-card');
    let hasVisibleCards = false;

    for (let i = 0; i < cards.length; i++) {
        if (cards[i].innerText.toLowerCase().includes(input)) {
            cards[i].style.display = "block";
            hasVisibleCards = true; 
        } else {
            cards[i].style.display = "none";
        }
    }

    let noMsg = document.getElementById('no-msg-' + listId);
    if (!hasVisibleCards) {
        if (!noMsg) {
            noMsg = document.createElement('div');
            noMsg.id = 'no-msg-' + listId;
            noMsg.className = 'glass-panel';
            noMsg.style.gridColumn = '1 / -1';
            noMsg.style.textAlign = 'center';
            noMsg.innerHTML = '<h3 style="color: var(--primary-color);"><span class="ar">لا يوجد محتوى مطابق لبحثك 😔</span><span class="en">No content matches your search 😔</span></h3>';
            container.appendChild(noMsg);
        } else {
            noMsg.style.display = 'block';
        }
    } else if (noMsg) {
        noMsg.style.display = 'none';
    }
};

window.toggleLanguage = () => {
    const body = document.body;
    const btn = document.getElementById('lang-btn');
    if(body.classList.contains('lang-ar')) {
        body.classList.replace('lang-ar', 'lang-en');
        body.dir = 'ltr';
        btn.innerText = '🌐 AR';
    } else {
        body.classList.replace('lang-en', 'lang-ar');
        body.dir = 'rtl';
        btn.innerText = '🌐 EN';
    }
};

window.toggleMobileMenu = () => { document.getElementById('nav-links').classList.toggle('show'); };
window.showPage = (id, el) => { document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); document.querySelectorAll('.nav-links a').forEach(l=>l.classList.remove('active')); document.getElementById(id).classList.add('active'); el.classList.add('active'); if(window.innerWidth < 768) toggleMobileMenu(); };

window.toggleTheme = () => { 
    const body = document.body;
    const logo = document.getElementById('site-logo');
    body.classList.toggle('dark-mode'); 
    if (body.classList.contains('dark-mode')) {
        logo.src = 'AM (1).png'; 
    } else {
        logo.src = 'AM.png'; 
    }
};

document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
window.openModal = (id) => { document.getElementById(id).style.display = 'flex'; };
window.closeModal = (id) => { document.getElementById(id).style.display = 'none'; };
window.switchAuthTab = (t) => { document.getElementById('login-form').style.display = t==='login'?'flex':'none'; document.getElementById('register-form').style.display = t==='register'?'flex':'none'; document.querySelectorAll('.auth-tab').forEach(b=>b.classList.remove('active')); event.target.classList.add('active'); };
