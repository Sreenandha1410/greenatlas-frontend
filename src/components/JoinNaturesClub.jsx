import { useState } from 'react'

// ⚠️ Replace with your actual WhatsApp group invite link
const WHATSAPP_LINK = 'https://chat.whatsapp.com/IHCv4qIEMlZ57bdwp4T3HC'

export default function JoinNaturesClub({ dark }) {
  const [form, setForm] = useState({ name: '', dept: '', year: '', phone: '' })
  const [submitted, setSubmitted] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleJoin = () => {
    if (!form.name.trim() || !form.dept.trim() || !form.year) {
      alert('Please fill in Name, Department and Year')
      return
    }
    window.open(WHATSAPP_LINK, '_blank')
    setSubmitted(true)
  }

  return (
    <section className="px-4 py-16"
      style={{ background: dark ? '#0d1117' : '#f0fdf4' }}>
      <div className="max-w-xl mx-auto">
        <div className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: dark ? '#161b22' : '#fff',
            border: `1px solid ${dark ? '#30363d' : '#bbf7d0'}`
          }}>

          {/* Header */}
          <div className="px-8 py-10 text-center"
            style={{ background: 'linear-gradient(135deg, #1a3618, #2d5a27, #3d7a35)' }}>
            <motion_div className="text-5xl mb-3">🌿</motion_div>
            <h2 className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: 'Cinzel, serif' }}>
              Join The Nature's Club
            </h2>
            <p className="text-sm" style={{ color: '#a5d6a7' }}>
              Be part of Sona College's green community
            </p>
          </div>

          {/* Body */}
          <div className="p-8">
            {submitted ? (
              <div className="text-center py-6">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-bold mb-2"
                  style={{ color: dark ? '#e6edf3' : '#111827' }}>
                  Welcome to The Nature's Club!
                </h3>
                <p className="text-sm" style={{ color: dark ? '#8b949e' : '#6b7280' }}>
                  You've been redirected to the WhatsApp group. See you there! 🌱
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'name', label: 'Full Name *', placeholder: 'Your name' },
                    { key: 'dept', label: 'Department *', placeholder: 'e.g. CSE, ECE, MECH' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                        style={{ color: dark ? '#8b949e' : '#6b7280' }}>
                        {label}
                      </label>
                      <input value={form[key]} onChange={e => set(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                        style={{
                          background: dark ? '#0d1117' : '#f9fafb',
                          border: `1.5px solid ${dark ? '#30363d' : '#e5e7eb'}`,
                          color: dark ? '#e6edf3' : '#111827'
                        }} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: dark ? '#8b949e' : '#6b7280' }}>
                      Year *
                    </label>
                    <select value={form.year} onChange={e => set('year', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{
                        background: dark ? '#0d1117' : '#f9fafb',
                        border: `1.5px solid ${dark ? '#30363d' : '#e5e7eb'}`,
                        color: form.year ? (dark ? '#e6edf3' : '#111827') : (dark ? '#6e7681' : '#9ca3af')
                      }}>
                      <option value="">Select year</option>
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                      <option>Staff / Faculty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: dark ? '#8b949e' : '#6b7280' }}>
                      Phone (optional)
                    </label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)}
                      placeholder="Mobile number"
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{
                        background: dark ? '#0d1117' : '#f9fafb',
                        border: `1.5px solid ${dark ? '#30363d' : '#e5e7eb'}`,
                        color: dark ? '#e6edf3' : '#111827'
                      }} />
                  </div>
                </div>

                <button onClick={handleJoin}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm
                             flex items-center justify-center gap-2 mt-2
                             hover:opacity-90 active:scale-95 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #25d366, #128c7e)',
                    boxShadow: '0 4px 16px rgba(37,211,102,0.35)'
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Join WhatsApp Group
                </button>

                <p className="text-xs text-center" style={{ color: dark ? '#6e7681' : '#9ca3af' }}>
                  You'll be redirected to The Nature's Club WhatsApp group 🌿
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
