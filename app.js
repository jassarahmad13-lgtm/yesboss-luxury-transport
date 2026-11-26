
const SUPABASE_URL = "https://dotrvdjesmwsmokyzszp.supabase.co";
const SUPABASE_KEY = "sb_publishable_HX8WxtUnOkYA6RPo8o0YyA_tVcFKLCY";

const APP_URL = "https://yesboss-luxury-transport.jassarahmad13.workers.dev";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


document.addEventListener("DOMContentLoaded", async function () {
  db.auth.onAuthStateChange(function (event, session) {
    if (
      event === "PASSWORD_RECOVERY" ||
      (session && window.location.hash.includes("type=recovery"))
    ) {
      showResetForm();
    }
  });

  const { data } = await db.auth.getSession();

  if (
    data.session &&
    window.location.hash.includes("type=recovery")
  ) {
    showResetForm();
  } else {
    showLogin();
  }
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
          <input type="email" id="email" required>
          <br><br>
          <label>Password</label>
          <input type="password" id="password" required>
          <br><br>
          <button type="submit">LOGIN</button>
        </form>
        <p><a href="#" id="forgotLink">Forgot Password?</a></p>
        <p id="message"></p>
      </section>
    </main>
  `;

  document.getElementById("loginForm").addEventListener("submit", loginUser);

  document.getElementById("forgotLink").addEventListener("click", function (e) {
    e.preventDefault();
    showForgotForm();
  });
}

function showForgotForm() {
  document.body.innerHTML = `
    <main class="container">
      <section class="card">
        <h2>Forgot Password</h2>
        <p>Enter your registered email address.</p>
        <form id="forgotForm">
          <input type="email" id="resetEmail" placeholder="Email Address" required>
          <br><br>
          <button type="submit">SEND RESET EMAIL</button>
        </form>
        <p id="message"></p>
        <button id="backButton">BACK TO LOGIN</button>
      </section>
    </main>
  `;

  document.getElementById("backButton").onclick = showLogin;

  document.getElementById("forgotForm").onsubmit = async function (e) {
    e.preventDefault();
    const message = document.getElementById("message");
    message.textContent = "Sending email...";

    const { error } = await db.auth.resetPasswordForEmail(
      document.getElementById("resetEmail").value.trim(),
      { redirectTo: APP_URL }
    );

    message.textContent = error
      ? error.message
      : "Reset email sent. Check your inbox.";
  };
}

function showResetForm() {
  document.body.innerHTML = `
    <main class="container">
      <section class="card">
        <h2>Create New Password</h2>
        <form id="newPasswordForm">
          <label>New Password</label>
          <input type="password" id="newPassword" minlength="8" required>
          <br><br>
          <label>Confirm Password</label>
          <input type="password" id="confirmPassword" minlength="8" required>
          <br><br>
          <button type="submit">SAVE NEW PASSWORD</button>
        </form>
        <p id="message"></p>
      </section>
    </main>
  `;

  document.getElementById("newPasswordForm").onsubmit = async function (e) {
    e.preventDefault();

    const password = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    const message = document.getElementById("message");

    if (password !== confirm) {
      message.textContent = "Passwords do not match.";
      return;
    }

    message.textContent = "Saving password...";

    const { error } = await db.auth.updateUser({ password });

    if (error) {
      message.textContent = error.message;
      return;
    }

    message.textContent = "Password updated successfully. Please login.";

    await db.auth.signOut();
    setTimeout(showLogin, 2000);
  };
}

async function loginUser(e) {
  e.preventDefault();

  const message = document.getElementById("message");
  message.textContent = "Logging in...";

  const { data, error } = await db.auth.signInWithPassword({
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", data.user.id)
    .single();
  console.log("PROFILE DEBUG:", {
  userId: data.user.id,
  profile,
  profileError
});

  if (profileError || !profile || !profile.is_active) {
    await db.auth.signOut();
    message.textContent = "Active profile not found. Contact Admin.";
    return;
  }

  showDashboard(profile);
}

function showDashboard(profile) {
  const roleNames = {
    admin: "Office Admin",
    manager: "Manager",
    driver: "Driver"
  };

  document.body.innerHTML = `
    <header class="header">
      <h1>YESBOSS</h1>
      <p>Luxury Transport LLC</p>
    </header>
    <main class="container">
      <section class="card">
        <h2>Login Successful</h2>
        <p>Welcome, ${escapeText(profile.full_name || "User")}</p>
        <p>Account Role: ${roleNames[profile.role] || "User"}</p>
        <p>Your account is active.</p>
        <button id="logoutButton">LOGOUT</button>
      </section>
    </main>
  `;

  document.getElementById("logoutButton").onclick = async function () {
    await db.auth.signOut();
    showLogin();
  };
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
    
