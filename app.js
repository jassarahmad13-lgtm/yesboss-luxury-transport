const SUPABASE_URL = "https://dotrvdjesmwsmokyzszp.supabase.co";
const SUPABASE_KEY = "sb_publishable_HX8WxtUnOkYA6RPo8o0YyA_tVcFKLCY";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentProfile = null;
let activeDrivers = [];

document.addEventListener("DOMContentLoaded", async () => {
appStyles();

const { data: { session }, error } = await db.auth.getSession();

if (error) {
showLogin(error.message);
return;
}

if (session) {
await loadUserProfile(session.user);
} else {
showLogin();
}

db.auth.onAuthStateChange((event) => {
if (event === "PASSWORD_RECOVERY") {
showResetForm();
}
});
});

function appStyles() {
if (document.getElementById("yesboss-styles")) return;

const style = document.createElement("style");
style.id = "yesboss-styles";

style.textContent = `
* { box-sizing: border-box; }

body {
margin: 0;
background: #101820;
color: white;
font-family: Arial, sans-serif;
}

.header {
background: #080d12;
padding: 22px 15px;
text-align: center;
border-bottom: 2px solid #c9a45c;
}

.header h1 {
color: #d6b56d;
margin: 0;
font-size: 23px;
}

.header p { color: #ccc; margin-bottom: 0; }

.container {
max-width: 1100px;
margin: 25px auto;
padding: 15px;
}

.card {
background: #1b2732;
padding: 20px;
border-radius: 12px;
border: 1px solid #394653;
margin-bottom: 18px;
}

h2, h3 { color: #d6b56d; }

input, select {
width: 100%;
padding: 13px;
margin: 8px 0 15px;
border: 1px solid #596775;
border-radius: 7px;
background: #101820;
color: white;
font-size: 16px;
}

label {
display: block;
color: #ddd;
font-size: 14px;
margin-top: 5px;
}

button {
padding: 13px 18px;
background: #c9a45c;
color: #101820;
border: none;
border-radius: 7px;
font-size: 15px;
font-weight: bold;
cursor: pointer;
margin: 5px 0;
}

button:disabled {
opacity: 0.5;
cursor: not-allowed;
}

button.secondary {
background: #394653;
color: white;
}

.full { width: 100%; }

.message {
color: #f0c879;
margin: 12px 0;
overflow-wrap: anywhere;
}

.stats {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
gap: 12px;
margin-bottom: 20px;
}

.stat {
background: #1b2732;
border: 1px solid #c9a45c;
border-radius: 10px;
padding: 17px;
}

.stat span { color: #ccc; font-size: 14px; }

.stat strong {
display: block;
font-size: 28px;
color: #d6b56d;
margin-top: 10px;
}

.table-wrap { overflow-x: auto; }

table {
width: 100%;
border-collapse: collapse;
min-width: 650px;
}

th, td {
padding: 12px;
border-bottom: 1px solid #394653;
text-align: left;
font-size: 13px;
}

th { color: #d6b56d; }

.topline {
display: flex;
justify-content: space-between;
align-items: center;
flex-wrap: wrap;
gap: 10px;
}

.muted { color: #b8c1c9; font-size: 13px; }

.status {
color: #f0c879;
text-transform: capitalize;
}

@media(max-width: 500px) {
.header h1 { font-size: 19px; }
.container { padding: 10px; }
}
`;

document.head.appendChild(style);
}

function appHeader() {
return `
<div class="header">
<h1>YESBOSS Luxury Transport LLC</h1>
<p>Transport Management System</p>
</div>
`;
}

function escapeText(value) {
return String(value ?? "").replace(/[&<>"']/g, char => ({
"&": "&amp;",
"<": "&lt;",
">": "&gt;",
'"': "&quot;",
"'": "&#039;"
})[char]);
}

function showLogin(message = "") {
document.body.innerHTML = `
${appHeader()}
<div class="container">
<div class="card">
<h2>Office Login</h2>
<p class="muted">Sign in to your YESBOSS account</p>

<form id="loginForm">
<label>Email Address</label>
<input id="email" type="email" required placeholder="Enter your email">

<label>Password</label>
<input id="password" type="password" required placeholder="Enter your password">

<button class="full" type="submit">LOGIN</button>
</form>

<p class="message" id="message">${escapeText(message)}</p>
<button class="secondary full" onclick="showForgotForm()">Forgot Password?</button>
</div>
</div>
`;

document.getElementById("loginForm").addEventListener("submit", loginUser);
}

async function loginUser(event) {
event.preventDefault();

const message = document.getElementById("message");
message.textContent = "Signing in...";

const email = document.getElementById("email").value.trim();
const password = document.getElementById("password").value;

const { data, error } = await db.auth.signInWithPassword({
email,
password
});

if (error) {
message.textContent = error.message;
return;
}

await loadUserProfile(data.user);
}

async function loadUserProfile(user) {
currentUser = user;

const { data: profile, error } = await db
.from("profiles")
.select("full_name, role, is_active")
.eq("id", user.id)
.single();

if (error || !profile || !profile.is_active) {
showLogin("Profile Error: " + (error?.message || "Profile missing or inactive"));
return;
}

currentProfile = profile;

const role = String(profile.role || "").toLowerCase();

if (!["admin", "manager"].includes(role)) {
showLogin("This dashboard is for office staff only.");
return;
}

showDashboard(profile);
}

function showForgotForm() {
document.body.innerHTML = `
${appHeader()}
<div class="container">
<div class="card">
<h2>Reset Password</h2>
<p>Enter your registered email address.</p>

<input id="resetEmail" type="email" placeholder="Email address">

<button class="full" onclick="sendResetEmail()">SEND RESET LINK</button>

<p class="message" id="message"></p>

<button class="secondary full" onclick="showLogin()">Back to Login</button>
</div>
</div>
`;
}

async function sendResetEmail() {
const email = document.getElementById("resetEmail").value.trim();
const message = document.getElementById("message");

if (!email) {
message.textContent = "Please enter your email.";
return;
}

message.textContent = "Sending reset link...";

const { error } = await db.auth.resetPasswordForEmail(email, {
redirectTo: window.location.origin
});

message.textContent = error
? error.message
: "Password reset link sent. Check your email.";
}

function showResetForm() {
document.body.innerHTML = `
${appHeader()}
<div class="container">
<div class="card">
<h2>Choose New Password</h2>

<input id="newPassword" type="password" placeholder="New password">

<button class="full" onclick="saveNewPassword()">UPDATE PASSWORD</button>

<p class="message" id="message"></p>
</div>
</div>
`;
}

async function saveNewPassword() {
const password = document.getElementById("newPassword").value;
const message = document.getElementById("message");

if (!password || password.length < 6) {
message.textContent = "Password must be at least 6 characters.";
return;
}

message.textContent = "Updating password...";

const { error } = await db.auth.updateUser({ password });

if (error) {
message.textContent = error.message;
return;
}

message.textContent = "Password updated successfully.";

setTimeout(() => {
showLogin("Please sign in with your new password.");
}, 1500);
}

async function showDashboard(profile) {
document.body.innerHTML = `
${appHeader()}

<div class="container">

<div class="card">
<div class="topline">
<div>
<h2>Office Dashboard</h2>
<p>Welcome, <strong>${escapeText(profile.full_name)}</strong></p>
<p class="muted">Account Role: ${escapeText(profile.role)}</p>
</div>

<button onclick="logoutUser()">LOGOUT</button>
</div>
</div>

<div class="stats">

<div class="stat">
<span>Total Bookings</span>
<strong id="totalBookings">...</strong>
</div>

<div class="stat">
<span>Today's Bookings</span>
<strong id="todayBookings">...</strong>
</div>

<div class="stat">
<span>Active Drivers</span>
<strong id="activeDrivers">...</strong>
</div>

<div class="stat">
<span>Pending Bookings</span>
<strong id="pendingBookings">...</strong>
</div>

</div>

<div class="card">

<h3>Create New Booking</h3>
<p class="muted">Enter passenger and trip information.</p>

<form id="bookingForm">

<label>Guest Name *</label>
<input id="guestName" type="text" required placeholder="Enter guest name">

<label>Guest Phone</label>
<input id="guestPhone" type="tel" placeholder="Enter phone number">

<label>Trip Type *</label>
<select id="tripType" required>
<option value="arrival">Arrival</option>
<option value="departure">Departure</option>
</select>

<label>Pickup Location *</label>
<input id="pickupLocation" type="text" required placeholder="Pickup location">

<label>Drop-off Location *</label>
<input id="dropoffLocation" type="text" required placeholder="Drop-off location">

<label>Flight Number</label>
<input id="flightNumber" type="text" placeholder="Flight number">

<label>Booking Date *</label>
<input id="bookingDate" type="date" required>

<label>Pickup Time *</label>
<input id="pickupTime" type="time" required>

<label>Assign Driver</label>
<select id="assignedDriver">
<option value="">No Driver Assigned</option>
</select>

<p class="muted" id="driverMessage">Loading active drivers...</p>

<button class="full" id="createBookingButton" type="submit">
CREATE BOOKING
</button>

<p class="message" id="createBookingMessage"></p>

</form>

</div>

<div class="card">

<div class="topline">
<h3>Recent Bookings</h3>
<button class="secondary" onclick="refreshDashboard()">REFRESH</button>
</div>

<p class="muted" id="bookingMessage">Loading bookings...</p>

<div class="table-wrap">
<table>
<thead>
<tr>
<th>Reference</th>
<th>Guest</th>
<th>Trip</th>
<th>Pickup</th>
<th>Date</th>
<th>Status</th>
</tr>
</thead>

<tbody id="recentBookings">
<tr><td colspan="6">Loading...</td></tr>
</tbody>
</table>
</div>

</div>

<p class="muted">YESBOSS Luxury Transport LLC | Office Management System</p>

</div>
`;

document.getElementById("bookingForm")
.addEventListener("submit", createBooking);

await Promise.all([
refreshDashboard(),
loadActiveDrivers()
]);
}

async function loadActiveDrivers() {
const select = document.getElementById("assignedDriver");
const message = document.getElementById("driverMessage");

if (!select || !message) return;

message.textContent = "Loading active drivers...";

const { data, error } = await db
.from("profiles")
.select("id, full_name, driver_id")
.eq("role", "driver")
.eq("is_active", true)
.order("full_name");

if (error) {
message.textContent = "Driver Error: " + error.message;
return;
}

activeDrivers = data || [];

select.innerHTML = '<option value="">No Driver Assigned</option>';

activeDrivers.forEach(driver => {
const option = document.createElement("option");

option.value = driver.id;
option.textContent =
(driver.full_name || "Driver") +
(driver.driver_id ? " (" + driver.driver_id + ")" : "");

select.appendChild(option);
});

message.textContent = activeDrivers.length
? activeDrivers.length + " active driver(s) available."
: "No active drivers available.";
}

async function createBooking(event) {
event.preventDefault();

const button = document.getElementById("createBookingButton");
const message = document.getElementById("createBookingMessage");

if (!currentUser) {
message.textContent = "Please sign in again.";
return;
}

const guestName = document.getElementById("guestName").value.trim();
const guestPhone = document.getElementById("guestPhone").value.trim();
const tripType = document.getElementById("tripType").value;
const pickup = document.getElementById("pickupLocation").value.trim();
const dropoff = document.getElementById("dropoffLocation").value.trim();
const flight = document.getElementById("flightNumber").value.trim();
const bookingDate = document.getElementById("bookingDate").value;
const pickupTime = document.getElementById("pickupTime").value;
const driverId = document.getElementById("assignedDriver").value;

if (!guestName || !pickup || !dropoff || !bookingDate || !pickupTime) {
message.textContent = "Please complete all required fields.";
return;
}

const validDriver = !driverId ||
activeDrivers.some(driver => driver.id === driverId);

if (!validDriver) {
message.textContent = "Please select a valid active driver.";
return;
}

const datePart = bookingDate.replace(/-/g, "");
const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();

const bookingReference = "YESBOSS-" + datePart + "-" + randomPart;

const bookingData = {
booking_reference: bookingReference,
customer_name: guestName,
guest_name: guestName,
guest_phone: guestPhone || null,
trip_type: tripType,
booking_type: tripType,
pickup_location: pickup,
dropoff_location: dropoff,
flight_number: flight || null,
booking_date: bookingDate,
pickup_time: pickupTime,
assigned_driver: driverId || null,
status: driverId ? "assigned" : "pending",
created_by: currentUser.id,
assigned_by: driverId ? currentUser.id : null
};

button.disabled = true;
button.textContent = "SAVING BOOKING...";
message.textContent = "Please wait. Saving booking...";

try {
const { data, error } = await db
.from("bookings")
.insert(bookingData)
.select("id, booking_reference")
.single();

if (error) {
message.textContent = "Booking Error: " + error.message;
return;
}

message.textContent =
"Booking created successfully! Reference: " + data.booking_reference;

document.getElementById("bookingForm").reset();

await refreshDashboard();

} catch (error) {
message.textContent = "Error: " + error.message;

} finally {
button.disabled = false;
button.textContent = "CREATE BOOKING";
}
}

async function refreshDashboard() {
const message = document.getElementById("bookingMessage");

if (message) {
message.textContent = "Updating dashboard...";
}

const today = new Date().toLocaleDateString("en-CA");

const [
totalResult,
todayResult,
driverResult,
pendingResult,
recentResult
] = await Promise.all([

db.from("bookings")
.select("id", { count: "exact", head: true }),

db.from("bookings")
.select("id", { count: "exact", head: true })
.eq("booking_date", today),

db.from("profiles")
.select("id", { count: "exact", head: true })
.eq("role", "driver")
.eq("is_active", true),

db.from("bookings")
.select("id", { count: "exact", head: true })
.eq("status", "pending"),

db.from("bookings")
.select("*")
.order("created_at", { ascending: false })
.limit(10)

]);

setStat("totalBookings", totalResult);
setStat("todayBookings", todayResult);
setStat("activeDrivers", driverResult);
setStat("pendingBookings", pendingResult);

const tbody = document.getElementById("recentBookings");

if (!tbody) return;

if (recentResult.error) {
tbody.innerHTML = `
<tr>
<td colspan="6">${escapeText(recentResult.error.message)}</td>
</tr>
`;

if (message) message.textContent = "Could not load bookings.";
return;
}

const bookings = recentResult.data || [];

if (bookings.length === 0) {
tbody.innerHTML = `
<tr><td colspan="6">No bookings found.</td></tr>
`;

if (message) message.textContent = "No recent bookings.";
return;
}

tbody.innerHTML = bookings.map(booking => {
const guest = booking.guest_name || booking.customer_name || "N/A";

return `
<tr>
<td>${escapeText(booking.booking_reference || "N/A")}</td>
<td>${escapeText(guest)}</td>
<td>${escapeText(booking.trip_type || "N/A")}</td>
<td>${escapeText(booking.pickup_location || "N/A")}</td>
<td>${escapeText(booking.booking_date || "N/A")}</td>
<td class="status">${escapeText(booking.status || "N/A")}</td>
</tr>
`;
}).join("");

if (message) {
message.textContent = "Showing latest " + bookings.length + " bookings.";
}
}

function setStat(elementId, result) {
const element = document.getElementById(elementId);

if (!element) return;

if (result.error) {
element.textContent = "Error";
element.title = result.error.message;
console.error(result.error);
return;
}

element.textContent = result.count ?? 0;
}

async function logoutUser() {
const { error } = await db.auth.signOut();

currentUser = null;
currentProfile = null;
activeDrivers = [];

if (error) {
alert("Logout Error: " + error.message);
return;
}

showLogin("You have been logged out.");
}
  
