document.addEventListener("DOMContentLoaded", function () {
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

          <label>Select Role</label>
          <select id="role">
            <option value="admin">Office Admin</option>
            <option value="manager">Manager</option>
            <option value="driver">Driver</option>
          </select>

          <br><br>

          <button type="submit">LOGIN</button>
        </form>

        <p id="message"></p>
      </section>
    </main>
  `;

  document.getElementById("loginForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      document.getElementById("message").textContent =
        "Login screen ready. Secure login connection is the next step.";
    });
});
