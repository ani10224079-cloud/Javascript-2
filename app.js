const tbody = document.querySelector('#tabel-body');
const form = document.querySelector('#form-mahasiswa');
const inputCari = document.querySelector('#cari');
const pesan = document.querySelector('#pesan');

let semuaData = [];

// LANGKAH 3a: ambil data dari API (api.js)
async function muatData() {
  try {
    const daftar = await ambilMahasiswa();
    semuaData = buatRekap(daftar);
    tampilkan();
  } catch (err) {
    tampilkanPesan(`Gagal memuat data: ${err.message}`, 'error');
  }
}

function tampilkan() {
  const hasilCari = cariMahasiswa(semuaData, inputCari.value);
  renderTabel(hasilCari);
  renderStatistik(semuaData);
}

// LANGKAH 3b & 7: tampilkan data ke tabel + tombol hapus
function renderTabel(data) {
  tbody.replaceChildren();

  if (data.length === 0) {
    const trKosong = document.createElement('tr');
    const tdKosong = document.createElement('td');
    tdKosong.colSpan = 8;
    tdKosong.className = 'kosong';
    tdKosong.textContent = 'Tidak ada data';
    trKosong.append(tdKosong);
    tbody.append(trKosong);
    return;
  }

  for (const m of data) {
    const tr = document.createElement('tr');
    tr.classList.add(m.lulus ? 'lulus' : 'tidak-lulus');

    const kolomData = [m.nim, m.nama, m.tugas, m.uts, m.uas, m.nilaiAkhir, m.grade];
    for (const nilai of kolomData) {
      const td = document.createElement('td');
      td.textContent = nilai;
      tr.append(td);
    }

    const tdAksi = document.createElement('td');
    const btnHapus = document.createElement('button');
    btnHapus.className = 'btn-hapus';
    btnHapus.dataset.nim = m.nim;
    btnHapus.textContent = 'Hapus';
    tdAksi.append(btnHapus);
    tr.append(tdAksi);

    tbody.append(tr);
  }
}

// LANGKAH 4: statistik
function renderStatistik(data) {
  document.querySelector('#stat-jumlah').textContent = data.length;

  const jumlahLulus = data.filter((m) => m.lulus).length;
  document.querySelector('#stat-lulus').textContent = `${jumlahLulus}/${data.length}`;

  document.querySelector('#stat-rata').textContent = hitungRataRata(data);

  const tertinggi = cariTertinggi(data);
  document.querySelector('#stat-tertinggi').textContent = tertinggi
    ? `${tertinggi.nama} (${tertinggi.nilaiAkhir})`
    : '-';

  const distribusi = hitungDistribusiGrade(data);
  const teksDistribusi = Object.entries(distribusi)
    .map(([grade, jumlah]) => `${grade}: ${jumlah}`)
    .join(' · ');
  document.querySelector('#stat-distribusi').textContent = teksDistribusi;
}

function tampilkanPesan(teks, jenis) {
  pesan.textContent = teks;
  pesan.className = jenis;
}

// LANGKAH 5: pencarian
inputCari.addEventListener('input', () => {
  tampilkan();
});

// LANGKAH 6: tambah mahasiswa
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const f = new FormData(form);
  const baru = {
    nim: f.get('nim').trim(),
    nama: f.get('nama').trim(),
    tugas: f.get('tugas') === '' ? NaN : Number(f.get('tugas')),
    uts: f.get('uts') === '' ? NaN : Number(f.get('uts')),
    uas: f.get('uas') === '' ? NaN : Number(f.get('uas')),
  };

  const errors = validasiMahasiswa(baru);
  if (errors.length > 0) {
    tampilkanPesan(errors.join(', '), 'error');
    return;
  }

  try {
    const hasil = await tambahMahasiswa(baru);
    const [r] = buatRekap([hasil]);
    tampilkanPesan(`${r.nama} tersimpan: nilai ${r.nilaiAkhir} (${r.grade})`, 'sukses');
    form.reset();
    await muatData();
  } catch (err) {
    tampilkanPesan(`Gagal menyimpan: ${err.message}`, 'error');
  }
});

// LANGKAH 7 (BONUS): hapus dengan event delegation
tbody.addEventListener('click', async (event) => {
  const tombol = event.target.closest('.btn-hapus');
  if (!tombol) return;

  const nim = tombol.dataset.nim;
  if (!confirm(`Yakin ingin menghapus mahasiswa dengan NIM ${nim}?`)) return;

  try {
    const teks = await hapusMahasiswa(nim);
    tampilkanPesan(teks, 'sukses');
    await muatData();
  } catch (err) {
    tampilkanPesan(`Gagal menghapus: ${err.message}`, 'error');
  }
});

// ---------- Mulai ----------
muatData();