import { useEffect, useState } from 'react';
import { getTrees, uploadComplaintImage, submitComplaint } from '../api';
import { useDarkMode } from '../context/DarkModeContext';

export default function ComplaintDashboard({ selectedTree = null }) {

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
    getTrees()
      .then(res => setTrees(res.data))
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
          <label className="block text-sm font-semibold mb-2">
            Student Name *
          </label>

          <input
            name="student_name"
            value={form.student_name}
            onChange={handleChange}
            placeholder="Enter your name"
            className="input w-full"
            required
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Department *
          </label>

          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="input w-full"
            required
          >
            <option value="">Select department</option>
            <option>Computer Science and Design</option>
            <option>Computer Science and Engineering</option>
            <option>Information Technology</option>
            <option>Electronics and Communication Engineering</option>
            <option>Electrical and Electronics Engineering</option>
            <option>Mechanical Engineering</option>
            <option>Civil Engineering</option>
            <option>Other</option>
          </select>
        </div>

        {/* Tree Location */}
        <div className="md:col-span-2">

          <label className="block text-sm font-semibold mb-2">
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

            <select
              name="tree_id"
              value={form.tree_id}
              onChange={handleChange}
              className="input w-full"
              required
            >
              <option value="">
                Select tree location
              </option>

              {trees.map(tree => (
                <option
                  key={tree.tree_id}
                  value={tree.tree_id}
                >
                  {tree.common_name} — {tree.tree_id} — {tree.area}
                </option>
              ))}

            </select>

          )}

        </div>

        {/* Issue Type */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Issue Type *
          </label>

          <select
            name="issue_type"
            value={form.issue_type}
            onChange={handleChange}
            className="input w-full"
            required
          >
            <option value="">Select issue</option>
            <option value="Disease">🌱 Disease</option>
            <option value="Dryness">💧 Dryness</option>
            <option value="Maintenance">🛠️ Maintenance</option>
            <option value="Damage">⚠️ Damage</option>
            <option value="Other">📌 Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Description
          </label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the issue..."
            className="input w-full resize-none"
            rows={3}
          />
        </div>

        {/* Photo */}
        <div className="md:col-span-2">

          <label className="block text-sm font-semibold mb-2">
            Photo
          </label>

          <div
            className="border-2 border-dashed rounded-xl p-5 text-center"
            style={{
              borderColor: dark ? '#30363d' : '#cfe1ca'
            }}
          >

            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="w-full text-sm"
            />

            {uploading && (
              <p className="text-sm text-gray-500 mt-3">
                ⏳ Uploading photo...
              </p>
            )}

            {form.image_url && (
              <div className="mt-4">
                <img
                  src={form.image_url}
                  alt="Issue"
                  className="w-40 h-28 object-cover rounded-xl mx-auto"
                />

                <p className="text-xs text-green-600 mt-2">
                  ✓ Photo uploaded
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
