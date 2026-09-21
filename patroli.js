console.log("wtmd.js berhasil terhubung!");
//URL Apps Script
const WEB_APP_URL ="https://script.google.com/macros/s/AKfycbwfv5kQPoJdDpk0jflAOrR34-A_HEJlr0H2OLN4cKhyV8LIQuoBe90e90K_puNwz4Wn/exec";
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
const petugas3=document.getElementById("petugas3").value; 
console.log(petugas3);
const catatan=document.getElementById("catatan").value; 
console.log(catatan);

const dataPemeriksaan={
    tanggal,
    pemeriksaan,
    hasil,
    petugas1,
    petugas2,
    petugas3,
    catatan,
};
console.log(dataPemeriksaan);
kirimData(dataPemeriksaan);
});
//<--event click selesai disini
//Baru di bawah ini
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
            namaFile : "LOGBOOK_PATROLI.pdf"
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
        const canvasAsli = document.querySelectorAll("canvas");
        const canvasClone = wrapper.querySelectorAll("canvas");

        canvasAsli.forEach((asli, i) => {
            const clone = canvasClone[i];
            if (!clone) return;

            clone.width = asli.width;
            clone.height = asli.height;

            const ctx = clone.getContext("2d");
            ctx.drawImage(asli, 0, 0);
        });
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
/* Tanda Tangan Digital */

function setupTandaTangan(canvasId) {
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        console.log("Canvas tidak ditemukan:", canvasId);
        return;
    }

    const ctx = canvas.getContext("2d");

    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function mulaiGambar(e) {
        isDrawing = true;

        const rect = canvas.getBoundingClientRect();

        ctx.beginPath();
       ctx.moveTo(
            (e.clientX - rect.left) * (canvas.width / rect.width),
            (e.clientY - rect.top) * (canvas.height / rect.height)
        );
    }

    function gambar(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (Math.abs(x - lastX) < 15 && Math.abs(y - lastY) < 15) return;

    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
}

    function selesaiGambar() {
        isDrawing = false;
        ctx.closePath();
    }

    canvas.addEventListener("pointerdown", function (e) {
        isDrawing = true;
        canvas.setPointerCapture(e.pointerId);

        const rect = canvas.getBoundingClientRect();

        ctx.beginPath();
        ctx.moveTo(
            (e.clientX - rect.left) * (canvas.width / rect.width),
            (e.clientY - rect.top) * (canvas.height / rect.height)
        );

        lastX = (e.clientX - rect.left) * (canvas.width / rect.width);
        lastY = (e.clientY - rect.top) * (canvas.height / rect.height);
    });

canvas.addEventListener("pointermove", gambar);

canvas.addEventListener("pointerup", selesaiGambar);
canvas.addEventListener("pointercancel", selesaiGambar);

    console.log("TTD aktif:", canvasId);
}

/* Aktifkan 3 tanda tangan */
setupTandaTangan("ttd1");
setupTandaTangan("ttd2");
setupTandaTangan("ttd3");


/* Hapus tanda tangan */
function hapusTtd(canvasId) {
    const canvas = document.getElementById(canvasId);

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
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

function sembunyikanLoading() {
    const loading = document.getElementById("loadingOverlay");
    if (loading) {
        loading.style.display = "none";
    }
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
            logbook: "Patroli",
            aktivitas: "Mengakses"
        })
    })
    .then(response => response.json())
    .then(hasil => {
        console.log("Aktivitas Patroli berhasil dicatat:", hasil);
    })
    .catch(error => {
        console.error("Gagal mencatat aktivitas Patroli:", error);
    });

});