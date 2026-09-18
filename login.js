console.log("login.js berhasil terhubung!");
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx1uJw8LffWSSDZomAzMeddKumTqQlntW8sjgZ4zQk_gsE2r_Fpa9SZhTvmZO70PWlxpQ/exec";
console.log("URL Apps Script:", WEB_APP_URL);
const btnLogin = document.getElementById("btnLogin");

btnLogin.addEventListener("click", async function () {

    const loginText = document.getElementById("loginText");

    btnLogin.disabled = true;
    btnLogin.classList.add("loading");
    loginText.textContent = "MEMPROSES...";

    console.log("Tombol Login diklik!");

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // CEK INPUT
    if (!username || !password) {

        alert("Username dan password wajib diisi!");

        btnLogin.disabled = false;
        btnLogin.classList.remove("loading");
        loginText.textContent = "MASUK";

        return;
    }

    try {

        console.log("Mengirim data login...");

        const response = await fetch(WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "login",
                username: username,
                password: password
            })
        });

        const hasil = await response.json();

        console.log("Respon server:", hasil);

        // LOGIN BERHASIL
        if (hasil.status === "success") {

            alert("Login berhasil!");

            localStorage.setItem("username", hasil.username);
            localStorage.setItem("nama", hasil.nama);
            localStorage.setItem("role", hasil.role);

            window.location.href = "index.html";

        }

        // LOGIN GAGAL
        else {

            alert(hasil.message);

            btnLogin.disabled = false;
            btnLogin.classList.remove("loading");
            loginText.textContent = "MASUK";
        }

    } catch (error) {

        console.error("Error login:", error);

        alert("Tidak dapat terhubung ke server.");

        btnLogin.disabled = false;
        btnLogin.classList.remove("loading");
        loginText.textContent = "MASUK";
    }

});