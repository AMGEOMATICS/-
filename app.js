import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, sendEmailVerification, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

const isEn = () => document.body.classList.contains('lang-en');

onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('login-btn-nav');
    const userInfo = document.getElementById('user-info');
    const displayUsername = document.getElementById('display-username');
    const createBtns = document.querySelectorAll('.create-btn'); 
    const notifBtn = document.getElementById('notif-btn');
    const adminLink = document.getElementById('admin-nav-link');
    
    if (user && user.emailVerified || (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
        currentUser = user;
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex'; 
        displayUsername.innerText = user.displayName || user.email.split('@')[0];
        
        notifBtn.style.display = 'inline-block'; 
        createBtns.forEach(btn => btn.style.display = 'inline-block'); 
        
        if(user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            adminLink.style.display = 'inline-block'; 
        }
        
        closeModal('login-modal');
    } else {
        currentUser = null;
        loginBtn.style.display = 'inline-block';
        userInfo.style.display = 'none'; 
        notifBtn.style.display = 'none';
        adminLink.style.display = 'none';
        createBtns.forEach(btn => btn.style.display = 'none'); 
    }
    loadAllData();
});

window.registerUser = async () => { /* الأكواد السابقة لم تتغير */ 
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    if(!name) return alert(isEn() ? "Please enter a username first!" : "اكتب اسم المستخدم الأول!");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        alert(isEn() ? `Account created successfully, ${name}!\n\nWe have sent an activation link to your email.` : `تم إنشاء الحساب بنجاح يا ${name}!\n\nبعتنالك رسالة تفعيل على الإيميل.`);
        switchAuthTab('login');
    } catch (error) { alert(isEn() ? "Error: " + error.message : "خطأ: " + error.message); }
};

window.loginUser = async () => { /* الأكواد السابقة لم تتغير */ 
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (!userCredential.user.emailVerified && !isAdmin) {
            await signOut(auth);
            alert(isEn() ? "Your account is not activated yet! Please check your email." : "حسابك لسه متفعلش! راجع الإيميل بتاعك.");
            return;
        }
    } catch (error) { alert(isEn() ? "Incorrect email or password!" : "الإيميل أو الباسورد غلط!"); }
};

window.resetPassword = async () => { 
    const email = document.getElementById('login-email').value;
    if(!email) { alert(isEn() ? "Please enter your email in the login field first!" : "اكتب الإيميل في خانة الدخول الأول!"); return; }
    try { await sendPasswordResetEmail(auth, email); alert(isEn() ? "Password reset link sent to your email!" : "بعتنالك لينك تغيير الباسورد!"); } 
    catch (error) { alert(isEn() ? "An error occurred, make sure the email is registered." : "حصل مشكلة، اتأكد إن الإيميل متسجل."); }
};

window.logoutUser = async () => { await signOut(auth); window.location.reload(); };

window.saveDataProject = async () => {
    if(!currentUser) return;
    await addDoc(collection(db, "projects"), {
        title: document.getElementById('data-title').value,
        format: document.getElementById('data-format').value,
        date: document.getElementById('data-date').value,
        details: document.getElementById('data-details').value,
        link: document.getElementById('data-link').value,
        publisherName: currentUser.displayName || currentUser.email.split('@')[0], 
        publisherEmail: currentUser.email,
        status: 'pending',
        ratingSum: 0, ratingCount: 0, comments: [] // تجهيز قاعدة البيانات للتقييمات
    });
    alert(isEn() ? "Submitted for review!" : "تم إرسال المنشور للمراجعة!"); closeModal('create-data-modal');
};

window.saveCourse = async () => {
    if(!currentUser) return;
    await addDoc(collection(db, "courses"), {
        title: document.getElementById('course-title').value,
        details: document.getElementById('course-details').value,
        link: document.getElementById('course-link').value,
        publisherName: currentUser.displayName || currentUser.email.split('@')[0], publisherEmail: currentUser.email, status: 'pending', ratingSum: 0, ratingCount: 0, comments: []
    });
    alert(isEn() ? "Submitted for review!" : "تم إرسال الدورة للمراجعة!"); closeModal('create-course-modal');
};

window.saveProgram = async () => {
    if(!currentUser) return;
    await addDoc(collection(db, "programs"), {
        title: document.getElementById('program-title').value,
        details: document.getElementById('program-details').value,
        link: document.getElementById('program-link').value,
        publisherName: currentUser.displayName || currentUser.email.split('@')[0], publisherEmail: currentUser.email, status: 'pending', ratingSum: 0, ratingCount: 0, comments: []
    });
    alert(isEn() ? "Submitted for review!" : "تم إرسال البرنامج للمراجعة!"); closeModal('create-program-modal');
};

window.saveSite = async () => {
    if(!currentUser) return;
    await addDoc(collection(db, "sites"), {
        title: document.getElementById('site-title').value,
        details: document.getElementById('site-details').value,
        link: document.getElementById('site-link').value,
        publisherName: currentUser.displayName || currentUser.email.split('@')[0], publisherEmail: currentUser.email, status: 'pending', ratingSum: 0, ratingCount: 0, comments: []
    });
    alert(isEn() ? "Submitted for review!" : "تم إرسال الموقع للمراجعة!"); closeModal('create-site-modal');
};

function loadAllData() {
    listenCollection('projects', 'data-list', 'admin-data-list');
    listenCollection('courses', 'courses-list', 'admin-courses-list');
    listenCollection('programs', 'programs-list', 'admin-programs-list');
    listenCollection('sites', 'sites-list', 'admin-sites-list');
}

let userNotifications = []; 
let lastSeenNotifCount = 0;

window.openNotifications = () => {
    lastSeenNotifCount = userNotifications.length; 
    document.getElementById('notif-badge').style.display = 'none'; 
    openModal('notif-modal'); 
};

function listenCollection(colName, publicId, adminId) {
    onSnapshot(collection(db, colName), (snapshot) => {
        const publicCont = document.getElementById(publicId);
        const adminCont = document.getElementById(adminId);
        if(publicCont) publicCont.innerHTML = '';
        if(adminCont) adminCont.innerHTML = '';

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const status = data.status || 'approved'; 
            const isOwner = currentUser && currentUser.email === data.publisherEmail;
            const isAdmin = currentUser && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            let finalPublisher = data.publisherName || "مستخدم الجيوماتكس";
            if (data.publisherEmail && data.publisherEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) finalPublisher = "refatowner";

            if (isOwner && data.status && (status === 'approved' || status === 'rejected')) {
                if(!userNotifications.some(n => n.id === id)) {
                    userNotifications.push({ id, title: data.title, status, reason: data.rejectionReason });
                    renderNotifications();
                }
            }

            // حساب التقييم الحقيقي وعدد التعليقات
            let rSum = data.ratingSum || 0;
            let rCount = data.ratingCount || 0;
            let avg = rCount === 0 ? "جديد" : (rSum / rCount).toFixed(1);
            let commentsCount = data.comments ? data.comments.length : 0;

            const cardHTML = `
                <h3>${data.title}</h3>
                ${data.format ? `<p><strong><span class="ar">الصيغة:</span><span class="en">Format:</span></strong> ${data.format}</p>` : ''}
                ${data.date ? `<p><strong><span class="ar">تاريخ البيانات:</span><span class="en">Date:</span></strong> <span style="direction:ltr; display:inline-block;">${data.date}</span></p>` : ''}
                <p>${data.details || ''}</p>
                <p><small style="color:var(--primary-color); font-weight:bold;"><span class="ar">الناشر:</span><span class="en">Publisher:</span> ${finalPublisher}</small></p>
                
                <!-- التقييم والتعليقات الحقيقية -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--glass-border);">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <span style="font-weight: bold; font-size: 1.1em;">
                            <span class="ar">التقييم: ${avg}/5 ⭐</span><span class="en">Rating: ${avg}/5 ⭐</span>
                        </span>
                        <a href="javascript:void(0)" onclick="ratePost('${colName}', '${id}')" style="color: var(--primary-color); font-size: 0.9em; font-weight: bold; text-decoration: none;">
                            <span class="ar">أضف تقييمك</span><span class="en">Rate this</span>
                        </a>
                    </div>
                    
                    <button onclick="openComments('${colName}', '${id}')" style="background: rgba(255, 255, 255, 0.1); border: 1px solid var(--glass-border); padding: 5px 15px; border-radius: 15px; color: var(--text-color);">
                        <span class="ar">💬 التعليقات (${commentsCount})</span><span class="en">💬 Comments (${commentsCount})</span>
                    </button>
                </div>

                <a href="${data.link}" target="_blank" style="display:block; margin-top:20px; color:#fff; background:var(--primary-color); text-align:center; padding:12px; border-radius:12px; text-decoration:none; font-size: 1.2em; font-weight: bold;">
                    <span class="ar">فتح الرابط</span><span class="en">Open Link</span>
                </a>
            `;

            if (status === 'pending' && isAdmin && adminCont) {
                const adminCard = document.createElement('div');
                adminCard.className = 'data-card glass-panel';
                adminCard.innerHTML = cardHTML + `<div class="admin-actions"><button onclick="approvePost('${colName}', '${id}')" style="background:#28a745; color: white;">موافقة ✅</button><button onclick="rejectPost('${colName}', '${id}')" style="background:#dc3545; color: white;">رفض ❌</button></div>`;
                adminCont.appendChild(adminCard);
            } else if (status === 'approved' && publicCont) {
                const publicCard = document.createElement('div');
                publicCard.className = 'data-card glass-panel';
                publicCard.innerHTML = (isAdmin ? `<button class="delete-btn" onclick="deleteItem('${colName}', '${id}')">🗑️</button>` : '') + cardHTML;
                publicCont.appendChild(publicCard);
            }
        });
    });
}

// --- نظام التقييم الحقيقي ---
window.ratePost = async (col, id) => {
    if(!currentUser) return alert(isEn() ? "Please login to rate!" : "لازم تسجل دخول عشان تقيم!");
    
    let score = prompt(isEn() ? "Rate from 1 to 5:" : "اكتب تقييمك من 1 لـ 5:");
    let val = parseFloat(score);
    
    if(val >= 1 && val <= 5) {
        const docRef = doc(db, col, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            let currentSum = docSnap.data().ratingSum || 0;
            let currentCount = docSnap.data().ratingCount || 0;
            await updateDoc(docRef, { ratingSum: currentSum + val, ratingCount: currentCount + 1 });
            alert(isEn() ? "Rating saved!" : "تم حفظ تقييمك بنجاح!");
        }
    } else if (score !== null) {
        alert(isEn() ? "Invalid rating. Enter a number between 1 and 5." : "تقييم غير صحيح، اكتب رقم من 1 لـ 5.");
    }
};

// --- نظام التعليقات الحقيقي ---
let currentPostRef = { col: null, id: null };
let commentsUnsubscribe = null;

window.openComments = (col, id) => {
    currentPostRef = { col, id };
    document.getElementById('new-comment').value = '';
    openModal('comments-modal');
    
    if (commentsUnsubscribe) commentsUnsubscribe();
    
    commentsUnsubscribe = onSnapshot(doc(db, col, id), (docSnap) => {
        if(docSnap.exists()){
            let data = docSnap.data();
            let list = document.getElementById('comments-list');
            list.innerHTML = '';
            
            if(data.comments && data.comments.length > 0){
                data.comments.forEach(c => {
                    list.innerHTML += `
                        <div style="background: rgba(0,0,0,0.1); padding: 12px; border-radius: 12px; border: 1px solid var(--glass-border);">
                            <strong style="color: var(--primary-color); font-size: 1.1em;">${c.name}</strong>
                            <p style="margin: 5px 0 0 0; font-size: 1em;">${c.text}</p>
                        </div>`;
                });
            } else {
                list.innerHTML = `<p style="text-align:center;"><span class="ar">لا توجد تعليقات بعد. كن أول من يعلق!</span><span class="en">No comments yet. Be the first!</span></p>`;
            }
        }
    });
};

window.addComment = async () => {
    if(!currentUser) return alert(isEn() ? "Please login to comment!" : "لازم تسجل دخول عشان تعلق!");
    
    let text = document.getElementById('new-comment').value;
    if(!text) return;
    
    const docRef = doc(db, currentPostRef.col, currentPostRef.id);
    await updateDoc(docRef, {
        comments: arrayUnion({
            name: currentUser.displayName || currentUser.email.split('@')[0],
            text: text
        })
    });
    document.getElementById('new-comment').value = ''; // تفريغ الخانة بعد الإرسال
};

window.approvePost = async (col, id) => { if(confirm(isEn() ? "Approve this post?" : "موافق تنشر البوست ده للناس؟")) await updateDoc(doc(db, col, id), { status: 'approved' }); };
window.rejectPost = async (col, id) => { const reason = prompt(isEn() ? "Enter reason for rejection:" : "اكتب سبب الرفض:"); if(reason) await updateDoc(doc(db, col, id), { status: 'rejected', rejectionReason: reason }); };
window.deleteItem = async (col, id) => { if(confirm(isEn() ? "Are you sure you want to delete this?" : "أكيد هتمسح البوست ده؟")) await deleteDoc(doc(db, col, id)); };

function renderNotifications() { /* الأكواد السابقة لم تتغير */ 
    const notifList = document.getElementById('notif-list'); const badge = document.getElementById('notif-badge');
    if(userNotifications.length > 0) {
        if (userNotifications.length > lastSeenNotifCount) badge.style.display = 'block';
        notifList.innerHTML = '';
        userNotifications.forEach(n => {
            const bgClass = n.status === 'approved' ? 'approved' : 'rejected';
            const msgAr = n.status === 'approved' ? `مبروك! تم الموافقة على منشورك "<strong>${n.title}</strong>".` : `تم رفض منشورك "<strong>${n.title}</strong>". <br><small style="color:#dc3545;">السبب: ${n.reason}</small>`;
            const msgEn = n.status === 'approved' ? `Your post "<strong>${n.title}</strong>" has been approved.` : `Your post "<strong>${n.title}</strong>" was rejected. <br><small style="color:#dc3545;">Reason: ${n.reason}</small>`;
            notifList.innerHTML += `<div class="notif-item ${bgClass}"><span class="ar">${msgAr}</span><span class="en">${msgEn}</span></div>`;
        });
    } else { notifList.innerHTML = `<p style="text-align:center;"><span class="ar">لا توجد إشعارات حالياً.</span><span class="en">No notifications currently.</span></p>`; }
}

window.filterSearch = (inputId, listId) => { /* الأكواد السابقة لم تتغير */ 
    const input = document.getElementById(inputId).value.toLowerCase(); const container = document.getElementById(listId); const cards = container.getElementsByClassName('data-card'); let hasVisibleCards = false;
    for (let i = 0; i < cards.length; i++) { if (cards[i].innerText.toLowerCase().includes(input)) { cards[i].style.display = "block"; hasVisibleCards = true; } else { cards[i].style.display = "none"; } }
    let noMsg = document.getElementById('no-msg-' + listId);
    if (!hasVisibleCards) { if (!noMsg) { noMsg = document.createElement('div'); noMsg.id = 'no-msg-' + listId; noMsg.className = 'glass-panel'; noMsg.style.gridColumn = '1 / -1'; noMsg.style.textAlign = 'center'; noMsg.innerHTML = '<h3 style="color: var(--primary-color);"><span class="ar">لا يوجد محتوى مطابق لبحثك 😔</span><span class="en">No content matches your search 😔</span></h3>'; container.appendChild(noMsg); } else { noMsg.style.display = 'block'; } } else if (noMsg) { noMsg.style.display = 'none'; }
};

window.toggleLanguage = () => { /* الأكواد السابقة لم تتغير */ 
    const body = document.body; const btn = document.getElementById('lang-btn'); const searchData = document.getElementById('search-data'); const searchCourses = document.getElementById('search-courses'); const searchPrograms = document.getElementById('search-programs'); const searchSites = document.getElementById('search-sites');
    if(body.classList.contains('lang-ar')) { body.classList.replace('lang-ar', 'lang-en'); body.dir = 'ltr'; if(btn) btn.innerText = '🌐 AR'; if(searchData) searchData.placeholder = "Search for shapefile..."; if(searchCourses) searchCourses.placeholder = "Search for courses..."; if(searchPrograms) searchPrograms.placeholder = "Search for programs..."; if(searchSites) searchSites.placeholder = "Search for useful sites..."; } 
    else { body.classList.replace('lang-en', 'lang-ar'); body.dir = 'rtl'; if(btn) btn.innerText = '🌐 EN'; if(searchData) searchData.placeholder = "ابحث عن شيب فايل..."; if(searchCourses) searchCourses.placeholder = "ابحث عن الدورات..."; if(searchPrograms) searchPrograms.placeholder = "ابحث عن برامج..."; if(searchSites) searchSites.placeholder = "ابحث عن مواقع..."; }
};

window.toggleMobileMenu = () => { document.getElementById('nav-links').classList.toggle('show'); };
window.showPage = (id, el) => { document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); document.querySelectorAll('.nav-links a').forEach(l=>l.classList.remove('active')); document.getElementById(id).classList.add('active'); el.classList.add('active'); if(window.innerWidth < 900) toggleMobileMenu(); };
window.toggleTheme = () => { const body = document.body; body.classList.toggle('dark-mode'); };

window.handleStartBtn = () => { if (currentUser) { const dataNavLink = document.querySelectorAll('.nav-links a')[1]; showPage('data', dataNavLink); } else { openModal('login-modal'); } };

document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
window.openModal = (id) => { document.getElementById(id).style.display = 'flex'; };
window.closeModal = (id) => { document.getElementById(id).style.display = 'none'; };
window.switchAuthTab = (t) => { document.getElementById('login-form').style.display = t==='login'?'flex':'none'; document.getElementById('register-form').style.display = t==='register'?'flex':'none'; document.querySelectorAll('.auth-tab').forEach(b=>b.classList.remove('active')); event.target.classList.add('active'); };
