import Navbar from "../../components/Navbar";

export default function Dashboard() {
  return (
    <>
      <Navbar />

      {/* Background gradient pakai variable baru */}
      <div
        className="min-h-screen px-6 py-10"
        style={{
          background: `
            linear-gradient(
              135deg,
              var(--bg-gradient-cream),
              var(--bg-gradient-pink),
              var(--bg-gradient-lavender)
            )
          `,
        }}
      >
        {/* Judul */}
        <h1 className="text-4xl font-semibold mb-4 text-[var(--brand-blue)]">
          Dashboard Nostressia
        </h1>

        <p className="text-lg mb-6 text-[var(--text-secondary)]">
          Selamat datang kembali! Semoga harimu baik 😊
        </p>

        {/* Glass Card */}
        <div className="p-6 rounded-2xl backdrop-blur-md mb-8 bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-[0_4px_20px_var(--glass-shadow)]">
          <h2 className="text-2xl font-semibold mb-3 text-[var(--brand-blue-light)]">
            Status Stres Hari Ini
          </h2>
          <p className="text-[var(--text-primary)]">
            Kamu berada pada kategori <strong>Normal</strong>. Tetap jaga
            kesehatan dan semangat ya!
          </p>
        </div>

        {/* Tombol Aksi */}
        <button className="px-6 py-3 rounded-xl font-semibold text-white transition bg-[var(--brand-orange)]">
          Mulai Prediksi Stres
        </button>

        {/* Card Motivasi */}
        <div className="mt-8 p-5 rounded-xl text-white bg-[var(--brand-blue)]">
          <h3 className="text-xl font-bold">Motivasi hari ini</h3>
          <p className="mt-2">
            “Tetap bergerak maju, meski perlahan. Yang penting kamu tidak
            berhenti.”
          </p>
        </div>

        {/* Card Tips */}
        <div className="mt-5 p-5 rounded-xl text-white bg-[var(--brand-orange)]">
          <h3 className="text-lg font-bold">Tips hari ini</h3>
          <ul className="list-disc ml-5 mt-2">
            <li>Istirahat cukup minimal 7 jam.</li>
            <li>Lakukan stretching ringan.</li>
            <li>Minum air putih yang cukup.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
