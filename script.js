import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// تكوين Firebase - استبدل هذه البيانات ببيانات مشروعك من Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyB0p0us6BuzD2ngzjhRnmUIhlOcBeRp0vQ",
  authDomain: "tok-tak-d6e17.firebaseapp.com",
  databaseURL: "https://tok-tak-d6e17-default-rtdb.firebaseio.com",
  projectId: "tok-tak-d6e17",
  storageBucket: "tok-tak-d6e17.appspot.com",
  messagingSenderId: "547062578826",
  appId: "1:547062578826:web:aa285cf798341be07cb773",
  measurementId: "G-7EMKEQKPVV"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// عناصر DOM
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const errorDiv = document.getElementById('errorMessage');
const successDiv = document.getElementById('successMessage');
const signupErrorDiv = document.getElementById('signupError');
const togglePassword = document.getElementById('togglePassword');
const googleBtn = document.getElementById('googleSignIn');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const loginCard = document.querySelector('.login-card:not(.signup-card)');
const signupCard = document.querySelector('.signup-card');
const forgotLink = document.getElementById('forgotPassword');
const rememberCheck = document.getElementById('remember');

// تبديل إظهار/إخفاء كلمة المرور
if (togglePassword) {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
    });
}

// عرض رسائل الخطأ
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
        setTimeout(() => element.classList.add('hidden'), 5000);
    }
}

function showSuccess(message) {
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.classList.remove('hidden');
        setTimeout(() => successDiv.classList.add('hidden'), 4000);
    }
}

// تعيين نوع الثبات (تذكرني)
async function setAuthPersistence(remember) {
    const persistenceType = remember ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);
}

// تسجيل الدخول
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const remember = rememberCheck.checked;

    if (!email || !password) {
        showError(errorDiv, 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }

    // تشغيل حالة التحميل
    loginBtn.disabled = true;
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<span>جاري التسجيل...</span><div class="btn-spinner"></div>';

    try {
        await setAuthPersistence(remember);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('تم تسجيل الدخول:', userCredential.user.email);
        showSuccess('✅ تم تسجيل الدخول بنجاح! جارٍ التحويل...');
        setTimeout(() => {
            window.location.href = "dashboard.html"; // غيرها إلى لوحة التحكم الخاصة بك
        }, 1500);
    } catch (error) {
        let errorMsg = 'فشل تسجيل الدخول.';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMsg = 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني.';
                break;
            case 'auth/wrong-password':
                errorMsg = 'كلمة المرور غير صحيحة.';
                break;
            case 'auth/invalid-email':
                errorMsg = 'صيغة البريد الإلكتروني غير صالحة.';
                break;
            default:
                errorMsg = error.message;
        }
        showError(errorDiv, errorMsg);
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
    }
});

// إنشاء حساب جديد
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        if (!name || !email || !password) {
            showError(signupErrorDiv, 'جميع الحقول مطلوبة');
            return;
        }
        if (password.length < 6) {
            showError(signupErrorDiv, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        signupBtn.disabled = true;
        signupBtn.innerHTML = 'جاري إنشاء الحساب...';

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // يمكنك تحديث الاسم هنا
            // await updateProfile(userCredential.user, { displayName: name });
            showSuccess('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.');
            // تبديل إلى بطاقة تسجيل الدخول
            loginCard.classList.remove('hidden');
            signupCard.classList.add('hidden');
            emailInput.value = email;
            passwordInput.value = '';
        } catch (error) {
            let errMsg = '';
            if (error.code === 'auth/email-already-in-use') errMsg = 'البريد الإلكتروني مستخدم بالفعل.';
            else errMsg = error.message;
            showError(signupErrorDiv, errMsg);
        } finally {
            signupBtn.disabled = false;
            signupBtn.innerHTML = 'إنشاء حساب';
        }
    });
}

// تسجيل الدخول عبر Google
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        googleBtn.disabled = true;
        googleBtn.innerHTML = '<div class="btn-spinner"></div> جاري الاتصال...';
        try {
            const result = await signInWithPopup(auth, googleProvider);
            showSuccess(`مرحباً ${result.user.displayName || 'المستخدم'}! جارٍ التوجيه...`);
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1200);
        } catch (error) {
            showError(errorDiv, 'فشل تسجيل الدخول عبر Google: ' + error.message);
        } finally {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg><span>الدخول باستخدام Google</span>';
        }
    });
}

// تبديل بين بطاقة التسجيل والدخول
if (showSignupLink) {
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginCard.classList.add('hidden');
        signupCard.classList.remove('hidden');
    });
}
if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupCard.classList.add('hidden');
        loginCard.classList.remove('hidden');
    });
}

// رابط نسيت كلمة المرور (يمكنك توجيهه إلى صفحة إعادة تعيين كلمة المرور)
if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) {
            showError(errorDiv, 'أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين');
            return;
        }
        // يمكنك استدعاء sendPasswordResetEmail هنا
        showSuccess(`تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}`);
    });
}
