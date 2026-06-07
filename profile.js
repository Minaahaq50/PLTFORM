import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    orderBy,
    limit,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Config (نفس البيانات من login)
const firebaseConfig = {
    apiKey: "AIzaSyDummyExampleReplaceWithYourOwnKey",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let userData = {};

// Helper Functions
function showToast(message, isError = false) {
    const toast = document.getElementById('toastMessage');
    toast.textContent = message;
    toast.style.background = isError ? 'rgba(255, 80, 100, 0.9)' : 'var(--primary)';
    toast.style.color = isError ? '#fff' : 'var(--dark-bg)';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function updateAvatarUI(avatarColor, name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const elements = ['navAvatar', 'sidebarInitials', 'profileInitials'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = initials;
    });
    
    const avatarElements = document.querySelectorAll('.user-avatar-mini, .sidebar-avatar, .avatar-large');
    avatarElements.forEach(el => {
        el.style.background = `linear-gradient(135deg, ${avatarColor}, ${adjustColor(avatarColor, -30)})`;
    });
}

function adjustColor(color, percent) {
    // Simple adjustment - you can expand this
    return color;
}

async function loadUserData(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            userData = userDoc.data();
        } else {
            userData = {
                name: currentUser.displayName || currentUser.email.split('@')[0],
                email: currentUser.email,
                phone: '',
                city: '',
                job: 'مطور ويب',
                company: '',
                website: '',
                bio: 'مرحباً! أنا عضو في هذه المنصة الرائعة',
                avatarColor: '#3ce0d4',
                memberSince: new Date(currentUser.metadata.creationTime).getFullYear(),
                loginCount: 1,
                skills: ['JavaScript', 'React', 'Firebase'],
                preferences: {
                    darkMode: true,
                    emailNotifications: true,
                    language: 'ar'
                }
            };
            await setDoc(doc(db, 'users', userId), userData);
        }
        
        updateAllUI();
        await addActivity('تسجيل دخول', 'تم تسجيل الدخول إلى حسابك');
    } catch (error) {
        console.error('Error:', error);
        showToast('خطأ في تحميل البيانات', true);
    }
}

function updateAllUI() {
    // Update name across all elements
    const nameElements = ['sidebarName', 'heroName'];
    nameElements.forEach(id => {
        document.getElementById(id).textContent = userData.name;
    });
    
    // Update email
    document.getElementById('sidebarEmail').textContent = userData.email;
    
    // Update bio
    document.getElementById('heroBio').textContent = userData.bio;
    
    // Update stats
    document.getElementById('memberSinceStat').textContent = userData.memberSince;
    document.getElementById('loginCountStat').textContent = userData.loginCount;
    
    // Update avatar
    updateAvatarUI(userData.avatarColor, userData.name);
    
    // Load personal info form
    loadPersonalInfoForm();
    loadProfessionalInfoForm();
    loadRecentActivity();
}

function loadPersonalInfoForm() {
    const personalGrid = document.getElementById('personalInfoGrid');
    if (!personalGrid) return;
    
    const fields = [
        { label: 'الاسم الكامل', key: 'name', type: 'text', value: userData.name },
        { label: 'البريد الإلكتروني', key: 'email', type: 'email', value: userData.email, readonly: true },
        { label: 'رقم الهاتف', key: 'phone', type: 'tel', value: userData.phone || '' },
        { label: 'المدينة', key: 'city', type: 'text', value: userData.city || '' },
        { label: 'السيرة الذاتية', key: 'bio', type: 'textarea', value: userData.bio }
    ];
    
    personalGrid.innerHTML = fields.map(field => `
        <div class="info-item">
            <span class="info-label">${field.label}</span>
            ${field.readonly ? 
                `<span class="info-value">${field.value}</span>` :
                `<span class="info-value editable" data-field="${field.key}" data-type="${field.type}">${field.value || 'غير محدد'}</span>
                <button class="edit-field-btn" data-field="${field.key}">✏️</button>`
            }
        </div>
    `).join('');
    
    // Add edit listeners
    document.querySelectorAll('.edit-field-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.field));
    });
}

function loadProfessionalInfoForm() {
    const profGrid = document.getElementById('professionalInfoGrid');
    if (!profGrid) return;
    
    const fields = [
        { label: 'المسمى الوظيفي', key: 'job', value: userData.job || '' },
        { label: 'الشركة', key: 'company', value: userData.company || '' },
        { label: 'الموقع الإلكتروني', key: 'website', value: userData.website || '' }
    ];
    
    profGrid.innerHTML = fields.map(field => `
        <div class="info-item">
            <span class="info-label">${field.label}</span>
            <span class="info-value editable" data-field="${field.key}">${field.value || 'غير محدد'}</span>
            <button class="edit-field-btn" data-field="${field.key}">✏️</button>
        </div>
    `).join('');
    
    // Load skills
    const skillsContainer = document.getElementById('skillsContainer');
    if (skillsContainer && userData.skills) {
        skillsContainer.innerHTML = userData.skills.map(skill => `
            <div class="skill-tag">
                ${skill}
                <button class="remove-skill" data-skill="${skill}">✕</button>
            </div>
        `).join('');
    }
}

async function loadRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    if (!activityList) return;
    
    try {
        const activitiesRef = collection(db, 'users', currentUser.uid, 'activities');
        const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            activityList.innerHTML = '<p class="no-data">لا توجد نشاطات حديثة</p>';
            return;
        }
        
        activityList.innerHTML = querySnapshot.docs.map(doc => {
            const activity = doc.data();
            return `
                <div class="activity-item">
                    <div class="activity-icon">${getActivityIcon(activity.type)}</div>
                    <div class="activity-details">
                        <p>${activity.description}</p>
                        <small>${formatTime(activity.timestamp)}</small>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

function getActivityIcon(type) {
    const icons = {
        'تسجيل دخول': '🔐',
        'تعديل': '✏️',
        'مشروع': '📁'
    };
    return icons[type] || '📌';
}

function formatTime(timestamp) {
    if (!timestamp) return 'منذ قليل';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
}

async function addActivity(type, description) {
    if (!currentUser) return;
    try {
        await addDoc(collection(db, 'users', currentUser.uid, 'activities'), {
            type,
            description,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error adding activity:', error);
    }
}

async function updateUserField(field, value) {
    try {
        await updateDoc(doc(db, 'users', currentUser.uid), { [field]: value });
        userData[field] = value;
        updateAllUI();
        await addActivity('تعديل', `تم تحديث ${getFieldName(field)}`);
        showToast('تم تحديث المعلومات بنجاح');
    } catch (error) {
        showToast('حدث خطأ أثناء التحديث', true);
    }
}

function getFieldName(field) {
    const names = {
        name: 'الاسم',
        phone: 'رقم الهاتف',
        city: 'المدينة',
        bio: 'السيرة الذاتية',
        job: 'المسمى الوظيفي',
        company: 'الشركة',
        website: 'الموقع الإلكتروني'
    };
    return names[field] || field;
}

function openEditModal(field) {
    const modal = document.getElementById('editModal');
    const modalBody = document.getElementById('editModalBody');
    const currentValue = userData[field] || '';
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label>${getFieldName(field)}</label>
            <input type="text" id="editFieldValue" class="modern-input" value="${currentValue}">
        </div>
    `;
    
    modal.classList.remove('hidden');
    
    const saveBtn = document.getElementById('saveModal');
    const cancelBtn = document.getElementById('cancelModal');
    const closeBtn = document.getElementById('closeModal');
    
    const saveHandler = async () => {
        const newValue = document.getElementById('editFieldValue').value;
        await updateUserField(field, newValue);
        modal.classList.add('hidden');
        cleanup();
    };
    
    const cleanup = () => {
        saveBtn.removeEventListener('click', saveHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
        closeBtn.removeEventListener('click', cancelHandler);
    };
    
    const cancelHandler = () => {
        modal.classList.add('hidden');
        cleanup();
    };
    
    saveBtn.addEventListener('click', saveHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    closeBtn.addEventListener('click', cancelHandler);
}

// Password Change
document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPwd = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirmPwd = document.getElementById('confirmPassword').value;
    
    if (newPwd !== confirmPwd) {
        showToast('كلمة المرور الجديدة غير متطابقة', true);
        return;
    }
    
    if (newPwd.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', true);
        return;
    }
    
    try {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPwd);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPwd);
        showToast('تم تغيير كلمة المرور بنجاح');
        document.getElementById('passwordForm').reset();
        await addActivity('تعديل', 'تم تغيير كلمة المرور');
    } catch (error) {
        showToast('كلمة المرور الحالية غير صحيحة', true);
    }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        showToast('خطأ في تسجيل الخروج', true);
    }
});

// Tab switching
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = item.dataset.tab;
        
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.getElementById(`${tabId}Tab`).classList.add('active');
    });
});

// Mobile menu
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
});

document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && e.target !== document.getElementById('mobileMenuBtn')) {
            sidebar.classList.remove('open');
        }
    }
});

// Avatar modal
document.getElementById('changeAvatarTrigger')?.addEventListener('click', () => {
    document.getElementById('avatarModal').classList.remove('hidden');
});

document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', async () => {
        const color = option.dataset.color;
        await updateUserField('avatarColor', color);
        document.getElementById('avatarModal').classList.add('hidden');
        showToast('تم تغيير لون الصورة الشخصية');
    });
});

document.getElementById('closeAvatarModal')?.addEventListener('click', () => {
    document.getElementById('avatarModal').classList.add('hidden');
});

// Add skill
document.getElementById('addSkillBtn')?.addEventListener('click', () => {
    const newSkill = prompt('أدخل اسم المهارة الجديدة:');
    if (newSkill && newSkill.trim()) {
        const skills = [...(userData.skills || []), newSkill.trim()];
        updateUserField('skills', skills);
        loadProfessionalInfoForm();
    }
});

// Remove skill
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-skill')) {
        const skillToRemove = e.target.dataset.skill;
        const newSkills = userData.skills.filter(s => s !== skillToRemove);
        await updateUserField('skills', newSkills);
        loadProfessionalInfoForm();
    }
});

// Preferences
document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
    updateUserField('preferences.darkMode', e.target.checked);
});

document.getElementById('emailNotifications')?.addEventListener('change', (e) => {
    updateUserField('preferences.emailNotifications', e.target.checked);
});

document.getElementById('languageSelect')?.addEventListener('change', (e) => {
    updateUserField('preferences.language', e.target.value);
});

// Edit mode button
document.getElementById('editModeBtn')?.addEventListener('click', () => {
    document.querySelector('.menu-item[data-tab="personal"]').click();
});

// Check auth state
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    await loadUserData(user.uid);
});
