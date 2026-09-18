console.log("app.js berhasil terhubung!");
//URL Apps Script
const WEB_APP_URL ="https://script.google.com/macros/s/AKfycbymBHdinwQXvV0Sqap56TW5Fsfnqs_gfu99jR6Kspu1a0sbWIF-CnSmKW983sRME3s7/exec";
const btnSimpan=document.getElementById("btnSimpan");
console.log(btnSimpan);
btnSimpan.addEventListener("click", function () {console.log("Tombol Simpan diklik!");
const tanggal=document.getElementById("tanggal").value; 
console.log(tanggal); 
const semuaCheckbox=document.querySelectorAll(".cek");
console.log(semuaCheckbox);
let pemeriksaan =[];
semuaCheckbox.forEach(function(checkbox){if(checkbox.checked){pemeriksaan.push(checkbox.classList[1]);}});
console.log(pemeriksaan);
const hasilInput =document.querySelector('input[name="hasil"]:checked')
const hasil =hasilInput ? hasilInput.value:"Belum dipilih";
console.log(hasil);
const petugas1=document.getElementById("petugas1").value;
console.log(petugas1);
const petugas2=document.getElementById("petugas2").value; 
console.log(petugas2);
const catatan=document.getElementById("catatan").value; 
console.log(catatan);

const dataPemeriksaan={
    tanggal,
    pemeriksaan,
    hasil,
    petugas1,
    petugas2,
    catatan,
};
console.log(dataPemeriksaan);
kirimData(dataPemeriksaan);
});
//<--event click selesai disini
//kirim di bawah ini
async function kirimData(dataPemeriksaan){
    tampilkanLoading();
    console.log ("Mulai mengirim data ke server...");
    try{
        /*1. Buat pdf terlebih dahulu*/
        const pdfBase64 = await buatPDF();
        console.log("PDF berhasil dibuat, mengirim data ke server...");

        /*2.gabungkan data logbook + pdf*/
        const dataKirim ={
            ...dataPemeriksaan,
            pdfBase64: pdfBase64,
            namaFile : "Logbook_Xray_Bagasi.pdf"
        };
        console.log("Data yang dikirim ke server:", dataKirim);

        /*3. Kirim data ke server*/
        const response = await fetch(WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify(dataKirim)
        });

        const hasil = await response.json();
        console.log("Respon dari server:", hasil);

        if (hasil.status === "success") {
            sembunyikanLoading();
            alert("Data berhasil dikirim dan PDF berhasil masuk Google Drive!");
            console.log ("Link PDF:", hasil.fileUrl);
        } else {
            sembunyikanLoading();
            alert("Data gagal dikirim:"+ hasil.message);
        }
    }catch (error) {
        sembunyikanLoading();
        console.error("Terjadi kesalahan saat mengirim data:", error);
        alert("Terjadi kesalahan saat mengirim data. Silakan coba lagi.");
    }
}


//buat cetak pdf//

async function buatPDF() {
    const header = document.querySelector(".header-logbook");
    const paper = document.querySelector(".paper");

    try {
        console.log("Mulai membuat PDF...");

        // Sembunyikan loading sementara
        document.getElementById("loadingOverlay").style.display = "none";

        // Gabungkan header + paper
        const wrapper = document.createElement("div");
        wrapper.style.background = "#ffffff";
        wrapper.appendChild(header.cloneNode(true));
        wrapper.appendChild(paper.cloneNode(true));
        document.body.appendChild(wrapper);

        const canvas = await html2canvas(wrapper, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff"
        });

        wrapper.remove();

        // Tampilkan loading lagi
        tampilkanLoading();

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const ratio = canvas.width / canvas.height;

        let imgWidth = pageWidth;
        let imgHeight = pageWidth / ratio;

        if (imgHeight > pageHeight) {
            imgHeight = pageHeight;
            imgWidth = pageHeight * ratio;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);

        console.log("PDF berhasil dibuat menjadi Base64.");

        return pdf.output("datauristring").split(",")[1];

    } catch (error) {
        console.error("Gagal membuat PDF:", error);
        tampilkanLoading();
    }
}

/*Tanda Tangan Digital*/

function setupTandaTangan(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";

    let isDrawing = false;

canvas.addEventListener("pointerdown", function (event) {
    isDrawing = true;
    canvas.setPointerCapture(event.pointerId);

    const rect = canvas.getBoundingClientRect();

    ctx.beginPath();
    ctx.moveTo(
        event.clientX - rect.left,
        event.clientY - rect.top
    );
});

canvas.addEventListener("pointermove", function (event) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(
        event.clientX - rect.left,
        event.clientY - rect.top
    );

    ctx.stroke();
});

canvas.addEventListener("pointerup", function () {
    isDrawing = false;
    ctx.closePath();
});

canvas.addEventListener("pointercancel", function () {
    isDrawing = false;
});
}


    /*Jalankan untuk kedua tanda tangan*/
    setupTandaTangan("ttd1");
    setupTandaTangan("ttd2");
    console.log("Tanda tangan Aktif");

/*hapus tanda tangan*/
function hapusTtd(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//fungsi loading overlay
function tampilkanLoading() {
    const loading = document.getElementById("loadingOverlay");
    if (loading) {
        loading.style.display = "flex";
    }
}

function sembunyikanLoading() {
    const loading = document.getElementById("loadingOverlay");
    if (loading) {
        loading.style.display = "none";
    }
}

// Loading hanya muncul saat proses kirim logbook

//sidebar

const sidebarToggle = document.getElementById("sidebarToggle");

if (sidebarToggle) {
    sidebarToggle.onclick = function () {
        document.getElementById("sidebar").classList.toggle("active");
    };
}
const btnStatistik = document.getElementById("btnStatistik");

if (btnStatistik) {
    btnStatistik.onclick = function () {
        document.getElementById("panelStatistik").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };
}

// CATAT AKTIVITAS PENGGUNA
window.addEventListener("load", function () {

   const nama = localStorage.getItem("nama");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!nama || !role) return;

    fetch("https://script.google.com/macros/s/AKfycbx1uJw8LffWSSDZomAzMeddKumTqQlntW8sjgZ4zQk_gsE2r_Fpa9SZhTvmZO70PWlxpQ/exec", {
        method: "POST",
        body: JSON.stringify({
        action: "aktivitas",
        username: username,
        nama: nama,
        role: role,
        logbook: "X-Ray Bagasi",
        aktivitas: "Mengakses"
})
    })
    .then(response => response.json())
    .then(hasil => {
        console.log("Aktivitas berhasil dicatat:", hasil);
    })
    .catch(error => {
        console.error("Gagal mencatat aktivitas:", error);
    });

});

window.addEventListener("load", function () {

    console.log("=== TEST AKTIVITAS BAGASI ===");

    const nama = localStorage.getItem("nama");
    const role = localStorage.getItem("role");

    console.log("Nama:", nama);
    console.log("Role:", role);
});