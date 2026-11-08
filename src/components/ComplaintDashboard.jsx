import { useEffect, useState } from 'react';
import { getTrees, uploadComplaintImage, submitComplaint } from '../api';
import { useDarkMode } from '../context/DarkModeContext';
import Treesearchselect from './Treesearchselect';
let cachedTrees = null;

export default function ComplaintDashboard({ selectedTree = null, onSuccess }) {

  const [dark] = useDarkMode();

  const [trees, setTrees] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    student_name: '',
    department: '',
    tree_id: selectedTree?.tree_id || '',
    issue_type: '',
    description: '',
    image_url: ''
  });

  useEffect(() => {
    if (cachedTrees) {
      setTrees(cachedTrees);
      return;
    }

    getTrees()
      .then(res => {
        cachedTrees = res.data;
        setTrees(res.data);
      })
      .catch(() => setError('Unable to load tree locations'));
  }, []);

  useEffect(() => {
    if (selectedTree) {
      setForm(prev => ({
        ...prev,
        tree_id: selectedTree.tree_id
      }));
    }
  }, [selectedTree]);

  const inputStyle = {
    background: dark ? '#21262d' : '#ffffff',
    borderColor: dark ? '#30363d' : '#dcebd7',
    color: dark ? '#e6edf3' : '#111827'
  };

  const labelStyle = {
    color: dark ? '#c9d1d9' : '#374151'
  };

  const chosenTree =
    trees.find(t => t.tree_id === form.tree_id) ||
    selectedTree;

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImage = async (e) => {

    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setError('');

    try {

      const data = new FormData();
      data.append('image', file);

      const res = await uploadComplaintImage(data);

      setForm(prev => ({
        ...prev,
        image_url: res.data.url
      }));

    } catch (err) {

      setError('Image upload failed');

    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError('');
    setSuccess('');

    if (
      !form.student_name ||
      !form.department ||
      !form.tree_id ||
      !form.issue_type
    ) {
      setError('Please fill all required fields.');
      return;
    }

    setSubmitting(true);

    try {

      await submitComplaint({
        ...form,
        tree_name: chosenTree?.common_name || '',
        tree_area: chosenTree?.area || ''
      });

      setSuccess(
        'Your issue has been reported successfully.'
      );

      setForm({
        student_name: '',
        department: '',
        tree_id: selectedTree?.tree_id || '',
        issue_type: '',
        description: '',
        image_url: ''
      });

      setTimeout(() => {
        onSuccess?.();
      }, 1500);

    } catch (err) {

      setError(
        err.response?.data?.error ||
        'Failed to submit report.'
      );

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="rounded-3xl p-6 md:p-8"
      style={{
        background: dark
          ? 'linear-gradient(145deg,#161b22,#1c2128)'
          : 'linear-gradient(145deg,#ffffff,#f2faf0)',
        border: `1px solid ${
          dark ? '#30363d' : '#dcebd7'
        }`,
        boxShadow: dark
          ? '0 12px 40px rgba(0,0,0,.25)'
          : '0 12px 40px rgba(45,90,39,.10)'
      }}
    >

      <div className="mb-6">

        <div className="flex items-center gap-3 mb-2">

          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: dark ? '#213c21' : '#e7f4e3'
            }}
          >
            🌿
          </div>

          <div>
            <h2
              className="text-2xl font-bold"
              style={{
                color: dark ? '#e6edf3' : '#172016'
              }}
            >
              Report a Tree Issue
            </h2>

            <p
              className="text-sm"
              style={{
                color: dark ? '#8b949e' : '#6b7280'
              }}
            >
              Help us keep the Green Atlas campus healthy.
            </p>
          </div>

        </div>

      </div>

      {success && (
        <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid md:grid-cols-2 gap-5"
      >

        {/* Student Name */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={labelStyle}>
            Student Name *
          </label>

          <input
            name="student_name"
            value={form.student_name}
            onChange={handleChange}
            placeholder="Enter your name"
            className="input w-full"
            style={inputStyle}
            required
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={labelStyle}>
            Department *
          </label>

          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="input w-full cursor-pointer"
            style={inputStyle}
            required
          >
            <option value="" style={{ background: dark ? '#21262d' : '#ffffff' }}>Select department</option>
            <option style={{ background: dark ? '#21262d' : '#ffffff' }}>Computer Science and Design</option>
            <option style={{ background: dark ? '#21262d' : '#ffffff' }}>Computer Science and Engineering</option>
            <option style={{ background: dark ? '#21262d' : '#ffffff' }}>Information Technology</option>
            <option style={{ background: dark ? '#21262d' : '#ffffff' }}>Electronics and Communication Engineering</option>
            <option style={{ background: dark ? '#21262d' : '#ffffff' }}>Electrical and Electronics Engineering</option>
            <option style={{ background: dark ? '#21262d' : '#ffffff' }}>Mechanical Engineering</option>
            <option style={{ background: dark ? '#21262d' : '#ffffff' }}>Civil Engineering</option>
            <option style={{ background: dark ? '#21262d' : '#ffffff' }}>Other</option>
          </select>
        </div>

        {/* Tree Location */}
        <div className="md:col-span-2">

          <label className="block text-sm font-semibold mb-2" style={labelStyle}>
            Tree Location *
          </label>

          {selectedTree ? (

            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: dark ? '#21262d' : '#eef7eb',
                border: `1px solid ${
                  dark ? '#30363d' : '#d4e8ce'
                }`
              }}
            >
              <p
                className="font-semibold"
                style={{
                  color: dark ? '#e6edf3' : '#172016'
                }}
              >
                🌳 {selectedTree.common_name}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {selectedTree.tree_id} · {selectedTree.area}
              </p>
            </div>

          ) : (

            <Treesearchselect
               label=""
               trees={trees}
               value={chosenTree || null}
               onChange={(t) =>
               setForm(prev => ({ ...prev, tree_id: t ? t.tree_id : '' }))
               }
             required
            />
        
          )}

        </div>

        {/* Issue Type */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={labelStyle}>
            Issue Type *
          </label>

          <select
            name="issue_type"
            value={form.issue_type}
            onChange={handleChange}
            className="input w-full cursor-pointer"
            style={inputStyle}
            required
          >
            <option value="" style={{ background: dark ? '#21262d' : '#ffffff' }}>Select issue</option>
            <option value="Disease" style={{ background: dark ? '#21262d' : '#ffffff' }}>🌱 Disease</option>
            <option value="Dryness" style={{ background: dark ? '#21262d' : '#ffffff' }}>💧 Dryness</option>
            <option value="Maintenance" style={{ background: dark ? '#21262d' : '#ffffff' }}>🛠️ Maintenance</option>
            <option value="Damage" style={{ background: dark ? '#21262d' : '#ffffff' }}>⚠️ Damage</option>
            <option value="Other" style={{ background: dark ? '#21262d' : '#ffffff' }}>📌 Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={labelStyle}>
            Description
          </label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the issue..."
            className="input w-full resize-none"
            style={inputStyle}
            rows={3}
          />
        </div>

        {/* Photo Upload with Custom Button */}
        <div className="md:col-span-2">

          <label className="block text-sm font-semibold mb-2" style={labelStyle}>
            Photo
          </label>

          <div
            className="border-2 border-dashed rounded-xl p-6 text-center transition-colors"
            style={{
              borderColor: dark ? '#30363d' : '#cfe1ca',
              background: dark ? 'rgba(33, 38, 45, 0.5)' : 'rgba(240, 247, 238, 0.4)'
            }}
          >
            <input
              id="complaint-photo-input"
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />

            <label
              htmlFor="complaint-photo-input"
              className="btn-secondary cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm"
              style={{
                background: dark ? '#21262d' : '#ffffff',
                color: dark ? '#81c784' : '#2e5e25',
                borderColor: dark ? '#30363d' : '#c8e6c9'
              }}
            >
              📷 Choose Image File
            </label>

            {uploading && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 animate-pulse">
                ⏳ Uploading photo...
              </p>
            )}

            {form.image_url && (
              <div className="mt-4">
                <img
                  src={form.image_url}
                  alt="Issue"
                  className="w-40 h-28 object-cover rounded-xl mx-auto shadow-md"
                />

                <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                  ✓ Photo uploaded successfully
                </p>
              </div>
            )}

          </div>

        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-end">

          <button
            type="submit"
            disabled={submitting || uploading}
            className="btn-primary px-7 py-3 disabled:opacity-50"
          >
            {submitting
              ? 'Submitting...'
              : 'Submit Report →'}
          </button>

        </div>

      </form>

    </section>
  );
}
