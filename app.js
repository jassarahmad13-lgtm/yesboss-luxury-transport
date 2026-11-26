
const SUPABASE_URL = "https://dotrvdjesmwsmokyzszp.supabase.co";

const SUPABASE_KEY = "sb_publishable_HX8WxtUnOkYA6RPo8o0YyA_tVcFKLCY";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

document.addEventListener("DOMContentLoaded", function () {
  showLogin();
});

function showLogin() {
  document.body.innerHTML = `
    <header class="header">
      <h1>YESBOSS</h1>
      <p>Luxury Transport LLC</p>
    </header>

    <main class="container">
      <section class="card">
        <h2>Welcome Back</h2>
        <p>Transport Management System</p>

        <form id="loginForm">
          <label>Email Address</label>
          <input type="email" id="email"
            placeholder="Enter your email" required>

          <br><br>

          <label>Password</label>
          <input type="password" id="password"
            placeholder="Enter your password" required>

          <br><br>

          <button type="submit">LOGIN</button>
        </form>

        <p id="message"></p>
      </section>
    </main>
  `;

  document.getElementById("loginForm")
    .addEventListener("submit", loginUser);
}

async function loginUser(event) {
  event.preventDefault();

  const message = document.getElementById("message");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  message.textContent = "Logging in...";

  const { data, error } = await db.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    message.textContent = "Login failed: " + error.message;
    return;
  }

  const user = data.user;

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    await db.auth.signOut();
    message.textContent = "Active profile not found. Contact Admin.";
    return;
  }

  showDashboard(profile);
}

function showDashboard(profile) {
  let roleName = "User";

  if (profile.role === "admin") roleName = "Office Admin";
  if (profile.role === "manager") roleName = "Manager";
  if (profile.role === "driver") roleName = "Driver";

  document.body.innerHTML = `
    <header class="header">
      <h1>YESBOSS</h1>
      <p>Luxury Transport LLC</p>
    </header>

    <main class="container">
      <section class="card">
        <h2>Login Successful</h2>
        <p>Welcome, ${escapeText(profile.full_name || "User")}</p>
        <p>Account Role: ${roleName}</p>
        <p>Your account is active.</p>
        <button id="logoutButton">LOGOUT</button>
      </section>
    </main>
  `;

  document.getElementById("logoutButton")
    .addEventListener("click", async function () {
      await db.auth.signOut();
      showLogin();
    });
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char];
  });
}
