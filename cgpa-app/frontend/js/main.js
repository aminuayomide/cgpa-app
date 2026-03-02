
import { 
    calculateGPA, 
    calculateCGPA, 
    calculateCGPAmax, 
    getClassification 
} from "./calculator.js";

// ----- FIREBASE IMPORTS -----
// These assume you have a firebase.js file that exports auth and db
import { auth, db } from './firebase.js';
import { 
    onAuthStateChanged, 
    signOut, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Mandatory Rule 1: Use specific appId for paths
const appId = typeof __app_id !== 'undefined' ? __app_id : 'amenstech-cgpa-calculator';

// ----- DOM ELEMENTS -----
const elements = {
    courseList: document.getElementById("course-list"),
    addCourseBtn: document.getElementById("add-course-btn"),
    calculateBtn: document.getElementById("calculate-btn"),
    calculateGoalBtn: document.getElementById("calculate-goal-btn"),
    logoutBtn: document.getElementById("logout-btn"),
    userHeader: document.getElementById("user-header"),
    userDisplay: document.getElementById("current-user-display"),
    prevCgpa: document.getElementById("prev-cgpa"),
    prevCredits: document.getElementById("prev-credits"),
    totalCredits: document.getElementById("total-program-credits"),
    resultGpa: document.getElementById("result-gpa"),
    resultCgpa: document.getElementById("result-cgpa"),
    classification: document.getElementById("cgpa-classification"),
    resultsSection: document.getElementById("results-section"),
    signupForm: document.getElementById("signup-form"),
    loginForm: document.getElementById("login-form"),
    authStatus: document.getElementById("status-message")
};

// ----- 1. AUTHENTICATION (Login, Signup, Logout) -----

// Handle Signup Form
if (elements.signupForm) {
    elements.signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirm-password').value;

        if (password !== confirm) return showAuthMsg("Passwords do not match!", "error");

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            window.location.href = 'dashboard.html'; 
        } catch (err) {
            showAuthMsg(err.message, "error");
        }
    });
}

// Handle Login Form
if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'dashboard.html';
        } catch (err) {
            showAuthMsg("Invalid email or password.", "error");
        }
    });
}

// Handle Logout
if (elements.logoutBtn) {
    elements.logoutBtn.onclick = () => {
        signOut(auth).then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    };
}

function showAuthMsg(msg, type) {
    if (!elements.authStatus) return;
    elements.authStatus.innerText = msg;
    elements.authStatus.classList.remove('hidden', 'text-red-500', 'text-emerald-500');
    elements.authStatus.classList.add(type === "error" ? 'text-red-500' : 'text-emerald-500');
}

// ----- 2. UI HELPERS (Adding/Removing Table Rows) -----

function createGradeSelect(selectedGrade = "A") {
    const select = document.createElement("select");
    select.className = "w-full p-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-bold text-emerald-700 outline-none";
    ["A", "B", "C", "D", "E", "F"].forEach(g => {
        const option = document.createElement("option");
        option.value = g;
        option.textContent = g;
        if (g === selectedGrade) option.selected = true;
        select.appendChild(option);
    });
    return select;
}

function addCourseRow(name = "", credits = 3, grade = "A") {
    if (!elements.courseList) return;
    const row = document.createElement("tr");
    row.className = "course-row border-b border-gray-50";
    row.innerHTML = `
        <td class="px-3 py-4">
            <input type="text" value="${name}" placeholder="CS101" class="w-full p-2 border border-gray-100 rounded-lg outline-none focus:border-emerald-500 transition-all" />
        </td>
        <td class="px-3 py-4">
            <input type="number" min="1" max="10" value="${credits}" class="w-full p-2 text-center border border-gray-100 rounded-lg outline-none focus:border-emerald-500" />
        </td>
        <td class="px-3 py-4 text-center"></td>
        <td class="px-3 py-4 text-right">
            <button class="delete-btn text-gray-300 hover:text-red-500 transition-colors p-2">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
        </td>
    `;
    // Add the grade dropdown to the empty 3rd cell
    row.cells[2].appendChild(createGradeSelect(grade));
    
    row.querySelector(".delete-btn").onclick = () => {
        row.remove();
        if (elements.courseList.children.length === 0) addCourseRow();
    };
    elements.courseList.appendChild(row);
}

function getCoursesFromUI() {
    return [...document.querySelectorAll(".course-row")].map(row => ({
        name: row.cells[0].querySelector("input").value,
        credits: Number(row.cells[1].querySelector("input").value) || 0,
        grade: row.cells[2].querySelector("select").value
    }));
}

// ----- 3. CLOUD SYNC (Save & Load) -----

async function saveToCloud(userId) {
    if (!userId) return;
    const data = {
        prevCgpa: Number(elements.prevCgpa.value) || 0,
        prevCredits: Number(elements.prevCredits.value) || 0,
        totalProgramCredits: Number(elements.totalCredits.value) || 150,
        courses: getCoursesFromUI(),
        updatedAt: new Date().toISOString()
    };

    try {
        // Path follows Mandatory Rule 1
        const userRef = doc(db, 'artifacts', appId, 'users', userId, 'academicData', 'current');
        await setDoc(userRef, data);
        console.log("Progress saved.");
    } catch (e) {
        console.error("Save error:", e);
    }
}

async function loadFromCloud(userId) {
    try {
        const userRef = doc(db, 'artifacts', appId, 'users', userId, 'academicData', 'current');
        const snap = await getDoc(userRef);
        
        if (snap.exists()) {
            const data = snap.data();
            if (elements.prevCgpa) elements.prevCgpa.value = data.prevCgpa || 0;
            if (elements.prevCredits) elements.prevCredits.value = data.prevCredits || 0;
            if (elements.totalCredits) elements.totalCredits.value = data.totalProgramCredits || 150;
            
            if (elements.courseList) {
                elements.courseList.innerHTML = "";
                if (data.courses && data.courses.length > 0) {
                    data.courses.forEach(c => addCourseRow(c.name, c.credits, c.grade));
                } else {
                    addCourseRow();
                }
                runCalculation(false); 
            }
        } else {
            // Defaults for first-time login
            addCourseRow("Course 1", 3, "A");
            addCourseRow("Course 2", 3, "A");
        }
    } catch (e) {
        console.error("Load error:", e);
        addCourseRow();
    }
}

// ----- 4. CORE CALCULATION WRAPPER -----

function runCalculation(shouldSave = true) {
    const courses = getCoursesFromUI();
    
    // Perform GPA/CGPA calculations using imported logic
    const gpaMetrics = calculateGPA(courses);
    const cgpaMetrics = calculateCGPA(
        Number(elements.prevCgpa.value) || 0,
        Number(elements.prevCredits.value) || 0,
        gpaMetrics
    );

    // Update the UI
    if (elements.resultGpa) elements.resultGpa.textContent = gpaMetrics.gpa.toFixed(2);
    if (elements.resultCgpa) elements.resultCgpa.textContent = cgpaMetrics.cgpa.toFixed(2);
    if (elements.classification) elements.classification.textContent = getClassification(cgpaMetrics.cgpa);
    if (elements.resultsSection) elements.resultsSection.classList.remove("hidden");

    // Automatically sync to cloud after calculation if user is logged in
    if (shouldSave && auth.currentUser) {
        saveToCloud(auth.currentUser.uid);
    }
}

// ----- 5. INITIALIZATION & SESSION OBSERVER -----

onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    const isAuthPage = path.includes('login.html') || path.includes('signup.html');
    
    if (user) {
        // User is logged in
        if (elements.userHeader) elements.userHeader.classList.remove('hidden');
        if (elements.userDisplay) elements.userDisplay.innerText = user.email;
        
        // Don't let logged-in users sit on the login page
        if (isAuthPage) window.location.href = 'index.html';
        
        // Fetch saved data on calculator page
        if (elements.courseList) loadFromCloud(user.uid);
    } else {
        // User is logged out
        if (!isAuthPage && (path.endsWith('index.html') || path.endsWith('/'))) {
            // Optional: You could redirect to login here
            // window.location.href = 'login.html'; 
        }
        if (elements.courseList && elements.courseList.children.length === 0) {
            addCourseRow();
        }
    }
});

// Calculator UI Bindings
if (elements.addCourseBtn) elements.addCourseBtn.onclick = () => addCourseRow();
if (elements.calculateBtn) elements.calculateBtn.onclick = () => runCalculation(true);

// CPF Planner (Maximum Achievable CGPA)
if (elements.calculateGoalBtn) {
    elements.calculateGoalBtn.onclick = () => {
        const curCgpa = parseFloat(elements.resultCgpa.textContent) || 0;
        const prevCreds = Number(elements.prevCredits.value) || 0;
        let semCreds = 0;
        document.querySelectorAll('.course-row').forEach(r => {
            semCreds += Number(r.querySelectorAll('input')[1].value) || 0;
        });
        
        const used = prevCreds + semCreds;
        const total = Number(elements.totalCredits.value) || 150;
        
        // Max potential math
        const max = calculateCGPAmax(curCgpa, used, total);
        
        const goalDiv = document.getElementById("goal-result");
        const requiredDisplay = document.getElementById("required-gpa-display");

        if (max !== null) {
            goalDiv.classList.remove("hidden");
            requiredDisplay.innerHTML = `
                Maximum final CGPA possible: <span class="text-emerald-600 font-bold">${max.toFixed(2)}</span>
                <br><span class="text-xs opacity-50">Assumes perfect 5.0 for the remaining ${total - used} credits.</span>
            `;
        }
    };
}