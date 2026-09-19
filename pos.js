console.log("pos.js aktif");

const DRAFT_KEY = "draftLogbookPos";
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzQmQpmPZuui5-NH7qPuObKJkQFPSfdcVeafAucecOPkXquG07Lw79qhbO5FWO4724-dQ/exec";


document.getElementById("tanggal").value =
    new Date().toISOString().split("T")[0];

function tambahKegiatan() {
    const tbody = document.getElementById("tabelKegiatan");
    const no = tbody.rows.length + 1;

    tbody.insertAdjacentHTML("beforeend", `
        <tr>
            <td>${no}</td>
            <td><input type="time" class="jam-kegiatan"></td>
            <td><textarea class="uraian-kegiatan"></textarea></td>
            <td><input type="text" class="tamu-kegiatan"></td>
            <td><textarea class="keterangan-kegiatan"></textarea></td>
            <td>
                <button type="button" onclick="hapusKegiatan(this)">
                    Hapus
                </button>
            </td>
        </tr>
    `);

    simpanDraft();
}

function hapusKegiatan(btn) {
    btn.closest("tr").remove();

    document.querySelectorAll("#tabelKegiatan tr").forEach((r, i) => {
        r.cells[0].textContent = i + 1;
    });

    simpanDraft();
}


function simpanDraft() {
    const data = {
        tanggal: document.getElementById("tanggal").value,
        jamMulai: document.getElementById("jamMulai").value,
        jamSelesai: document.getElementById("jamSelesai").value,
        petugas1: document.getElementById("petugas1").value,
        petugas2: document.getElementById("petugas2").value,
        petugas3: document.getElementById("petugas3").value,
        catatan: document.getElementById("catatan").value,

        kegiatan: [...document.querySelectorAll("#tabelKegiatan tr")].map(r => ({
            jam: r.querySelector(".jam-kegiatan").value,
            uraian: r.querySelector(".uraian-kegiatan").value,
            tamu: r.querySelector(".tamu-kegiatan").value,
            keterangan: r.querySelector(".keterangan-kegiatan").value
        })),

        ttd1: document.getElementById("ttd1").toDataURL(),
        ttd2: document.getElementById("ttd2").toDataURL(),
        ttd3: document.getElementById("ttd3").toDataURL(),
        ttdKoordinator: document.getElementById("ttdKoordinator").toDataURL()
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}


function tombolDraft() {
    simpanDraft();
    alert("Draft berhasil disimpan!");
}


// =========================
// LOAD DRAFT
// =========================

function loadDraft() {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));

    if (!draft) return;

    document.getElementById("tanggal").value = draft.tanggal || "";
    document.getElementById("jamMulai").value = draft.jamMulai || "";
    document.getElementById("jamSelesai").value = draft.jamSelesai || "";
    document.getElementById("petugas1").value = draft.petugas1 || "";
    document.getElementById("petugas2").value = draft.petugas2 || "";
    document.getElementById("petugas3").value = draft.petugas3 || "";
    document.getElementById("catatan").value = draft.catatan || "";

    (draft.kegiatan || []).forEach(k => {
        tambahKegiatan();

        const r = document.querySelector(
            "#tabelKegiatan tr:last-child"
        );

        r.querySelector(".jam-kegiatan").value = k.jam || "";
        r.querySelector(".uraian-kegiatan").value = k.uraian || "";
        r.querySelector(".tamu-kegiatan").value = k.tamu || "";
        r.querySelector(".keterangan-kegiatan").value =
            k.keterangan || "";
    });

    muatTtd("ttd1", draft.ttd1);
    muatTtd("ttd2", draft.ttd2);
    muatTtd("ttd3", draft.ttd3);
    muatTtd("ttdKoordinator", draft.ttdKoordinator);

    console.log("Draft dimuat");
}


function muatTtd(id, data) {
    if (!data) return;

    const c = document.getElementById(id);
    if (!c) return;

    const img = new Image();

    img.onload = () => {
        c.getContext("2d").drawImage(img, 0, 0);
    };

    img.src = data;
}


loadDraft();

if (!localStorage.getItem(DRAFT_KEY)) {
    tambahKegiatan();
}

// OTOMATIS SIMPAN

const logbookPos = document.querySelector(".logbook-pos");

if (logbookPos) {
    logbookPos.addEventListener("input", simpanDraft);
}

// RESET
function resetPos() {
    if (!confirm("Hapus seluruh data dan draft?")) return;

    localStorage.removeItem(DRAFT_KEY);
    location.reload();
}

// TANDA TANGAN

["ttd1", "ttd2", "ttd3", "ttdKoordinator"].forEach(id => {

    const c = document.getElementById(id);
    if (!c) return;

    c.width = c.offsetWidth;
    c.height = c.offsetHeight;

    const ctx = c.getContext("2d");

    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    let gambar = false;

    c.onmousedown = e => {
        gambar = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    };

    c.onmousemove = e => {
        if (!gambar) return;

        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    };

    c.onmouseup = () => gambar = false;
    c.onmouseleave = () => gambar = false;
});


// TTD KOORDINATOR

const imgKoordinator = new Image();

imgKoordinator.onload = () => {

    const c = document.getElementById("ttdKoordinator");
    if (!c) return;

    const ctx = c.getContext("2d");

    ctx.clearRect(0, 0, c.width, c.height);

    ctx.drawImage(
        imgKoordinator,
        60,
        40,
        c.width - 180,
        c.height - 60
    );
};

imgKoordinator.src = "image/ttd_paksaka.jpg";

async function buatPDF() {
    try {
        console.log("Mulai membuat PDF...");

        const logbook = document.querySelector(".logbook-pos");

        if (!logbook) {
            throw new Error("Elemen .logbook-pos tidak ditemukan.");
        }

        const clone = logbook.cloneNode(true);

        const wrapper = document.createElement("div");

        wrapper.style.background = "#ffffff";
        wrapper.style.position = "absolute";
        wrapper.style.left = "-99999px";
        wrapper.style.top = "0";

        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        // COPY ISI TTD KE CLONE
        const canvasAsli = logbook.querySelectorAll("canvas");
        const canvasClone = clone.querySelectorAll("canvas");

        canvasAsli.forEach((canvas, i) => {
            const target = canvasClone[i];

            if (!target) return;

            target.width = canvas.width;
            target.height = canvas.height;

            const ctx = target.getContext("2d");
            ctx.drawImage(canvas, 0, 0);
        });

        const hasilCanvas = await html2canvas(wrapper, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff"
        });

        wrapper.remove();

        const imgData = hasilCanvas.toDataURL("image/jpeg", 0.95);

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const ratio = hasilCanvas.width / hasilCanvas.height;

        let imgWidth = pageWidth;
        let imgHeight = pageWidth / ratio;

        if (imgHeight > pageHeight) {
            imgHeight = pageHeight;
            imgWidth = pageHeight * ratio;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);

        console.log("PDF berhasil dibuat.");

        return pdf.output("datauristring").split(",")[1];

    } catch (error) {
        console.error("Gagal membuat PDF:", error);
        throw error;
    }
}
// SIMPAN LOGBOOK

async function simpanPos() {
    tampilkanLoading();

    try {

        console.log("Mulai mengirim data Pos Jaga...");

        const pdf = await buatPDF();

        const data = {

            action: "simpanPos",

            tanggal:
                document.getElementById("tanggal").value,

            jamMulai:
                document.getElementById("jamMulai").value,

            jamSelesai:
                document.getElementById("jamSelesai").value,

            petugas1:
                document.getElementById("petugas1").value,

            petugas2:
                document.getElementById("petugas2").value,

            petugas3:
                document.getElementById("petugas3").value,

            kegiatan:
                [...document.querySelectorAll(
                    "#tabelKegiatan tr"
                )].map(r => ({

                    jam:
                        r.querySelector(
                            ".jam-kegiatan"
                        ).value,

                    uraian:
                        r.querySelector(
                            ".uraian-kegiatan"
                        ).value,

                    tamu:
                        r.querySelector(
                            ".tamu-kegiatan"
                        ).value,

                    keterangan:
                        r.querySelector(
                            ".keterangan-kegiatan"
                        ).value
                })),

            catatan:
                document.getElementById("catatan").value,

            pdf: pdf
        };


        const response = await fetch(URL_SCRIPT, {

            method: "POST",

            body: JSON.stringify(data)

        });


        const hasil = await response.json();


        console.log("Response server:", hasil);


        if (hasil.status === "success") {
            sembunyikanLoading();

            alert(
                "Logbook Pos Jaga berhasil disimpan!"
            );

        } else {

            throw new Error(
                hasil.message || "Gagal menyimpan data."
            );
        }


    } catch (error) {

    console.error(
        "Gagal:",
        error
    );

    sembunyikanLoading();

    alert(
        "Gagal menyimpan logbook."
    );
}}

function hapusTtd(canvasId) {
    const canvas = document.getElementById(canvasId);

    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function tampilkanLoading() {
    const loading = document.getElementById("loadingOverlay");
    if (loading) loading.style.display = "flex";
}

function sembunyikanLoading() {
    const loading = document.getElementById("loadingOverlay");
    if (loading) loading.style.display = "none";
}