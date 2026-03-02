import { auth } from './firebase.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// DOM Elements - Check for all possible form IDs across different pages
const authForm = document.getElementById('auth-form');     // Unified page
const loginForm = document.getElementById('login-form');   // Separate login page
const signupForm = document.getElementById('signup-form'); // Separate signup page
const statusMsg = document.getElementById('status-message');

// --- Unified Logic Handler ---
const handleAuthSubmit = async (e, mode) => {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('#email').value;
    const password = form.querySelector('#password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Determine if it's signup or login based on mode or button text
    const isSignup = mode === 'signup' || (submitBtn && submitBtn.innerText.toLowerCase().includes("create"));

    if (isSignup) {
        // SIGNUP LOGIC
        const confirmField = form.querySelector('#confirm-password');
        const confirmPassword = confirmField ? confirmField.value : null;
        
        if (confirmPassword !== null && password !== confirmPassword) {
            return showMessage("Passwords do not match.", "error");
        }

        try {
            submitBtn.disabled = true;
            console.log("Attempting to create account...");
            await createUserWithEmailAndPassword(auth, email, password);
            showMessage("Account created! Redirecting...", "success");
        } catch (error) {
            submitBtn.disabled = false;
            handleAuthError(error);
        }
    } else {
        // LOGIN LOGIC
        try {
            submitBtn.disabled = true;
            console.log("Attempting to sign in...");
            await signInWithEmailAndPassword(auth, email, password);
            showMessage("Login successful! Redirecting...", "success");
        } catch (error) {
            submitBtn.disabled = false;
            handleAuthError(error);
        }
    }
};

// Attach listeners to whichever form exists on the current page
if (authForm) authForm.addEventListener('submit', (e) => handleAuthSubmit(e, 'auto'));
if (loginForm) loginForm.addEventListener('submit', (e) => handleAuthSubmit(e, 'login'));
if (signupForm) signupForm.addEventListener('submit', (e) => handleAuthSubmit(e, 'signup'));

// --- HELPER FUNCTIONS ---

function showMessage(msg, type) {
    if (!statusMsg) return;
    statusMsg.classList.remove('hidden', 'text-red-500', 'text-emerald-500');
    statusMsg.innerText = msg;
    statusMsg.classList.add(type === 'success' ? 'text-emerald-500' : 'text-red-500');
}

function handleAuthError(error) {
    console.error("Firebase Auth Error:", error.code, error.message);
    let message = "An error occurred. Please try again.";
    
    if (error.code === 'auth/email-already-in-use') message = "This email is already registered.";
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') message = "Incorrect email or password.";
    if (error.code === 'auth/user-not-found') message = "No account found with this email.";
    if (error.code === 'auth/weak-password') message = "Password must be at least 6 characters.";
    if (error.code === 'auth/invalid-email') message = "Please enter a valid email address.";
    if (error.code === 'auth/operation-not-allowed') message = "Email/Password sign-in is not enabled in Firebase Console.";

    showMessage(message, "error");
}

// --- AUTH STATE OBSERVER ---
// This is the most reliable way to redirect. If Firebase says we are logged in, we move.
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Auth State Changed: User Logged In", user.email);
        
        const path = window.location.pathname;
        const pageName = path.split("/").pop().toLowerCase();
        
        // Comprehensive check for auth-related pages or the root path
        const isAuthPage = pageName === 'auth.html' || 
                           pageName === 'login.html' || 
                           pageName === 'signup.html' || 
                           pageName === '' || 
                           path === '/' ||
                           path.endsWith('/');

        if (isAuthPage) {
            console.log("Redirecting to index.html from:", path);
            // Using a short delay to allow success message to be briefly visible
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);
        }
    } else {
        console.log("Auth State Changed: No User Logged In");
    }
});

export const logoutUser = () => {
    return signOut(auth).then(() => {
        console.log("User logged out manually.");
        window.location.replace('auth.html');
    });
};