export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
        border: '1px solid #ccc', fontSize: '1rem', outline: 'none',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
      }}
    />
  );
}