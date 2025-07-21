'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [imageFiles, setImageFiles] = useState([]);
  const [textFiles, setTextFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDownloadReady, setIsDownloadReady] = useState(false);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const count = Math.max(imageFiles.length, textFiles.length);
    setSchedules((prev) =>
      Array.from({ length: count }, (_, i) => prev[i] || { time: '', post: `${i + 1}` })
    );
  }, [imageFiles, textFiles]);
  const handleDateChange = (index, newTime) => {
    const updated = [...schedules];
    updated[index].time = newTime;
    setSchedules(updated);
  };

  const repeatPreviousDate = (index) => {
    const updated = [...schedules];
    updated[index].time = updated[index - 1]?.time || '';
    setSchedules(updated);
  };

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

    console.log(BASE_URL,'line num 35');
    
  const handleSubmit = async () => {
    if (!imageFiles.length || !textFiles.length) {
      setStatus('⚠️ Upload image and text files.');
      return;
    }

    const allFilled = schedules.every((s) => s.time && s.post);
    if (!allFilled) {
      setStatus('⚠️ Fill all schedule times.');
      return;
    }

    setLoading(true);
    setStatus('');

    const formData = new FormData();
    imageFiles.forEach((file) => formData.append('files', file));
    textFiles.forEach((file) => formData.append('files', file));
    formData.append(
      'schedule_data',
      JSON.stringify(
        Object.fromEntries(schedules.map((s) => [`post${s.post}.jpg`, s.time]))
      )
    );

    try {

      const res = await axios.post(`${BASE_URL}/bulk-schedule`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        withCredentials:true
      });

      setStatus(res.status === 200 ? `✅ ${res.data.status}` : '❌ Scheduling failed.');
      setIsDownloadReady(true);
    } catch (err) {
      console.error(err);
      setStatus('❌ Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-10 space-y-10">
        <h1 className="text-4xl font-bold text-center text-indigo-600">📬 Telegram Scheduler Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block mb-2 font-semibold text-sm">📸 Upload Images</label>
            {/* Dropzone for Images */}
            <div
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files).filter(file =>
                  file.type.startsWith('image/')
                );
                setImageFiles(files);
              }}
              onDragOver={(e) => e.preventDefault()}
              className="w-full border-2 border-dashed border-indigo-300 rounded-lg p-20 text-center bg-gray-50 hover:bg-indigo-50 cursor-pointer"
              onClick={() => document.getElementById('imageInput').click()}
            >
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              />
              <p className="text-gray-500">📤 Drag & drop or click to upload <strong>Images</strong></p>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {imageFiles.length > 0
                ? `✅ ${imageFiles.length} image file${imageFiles.length > 1 ? 's' : ''} uploaded`
                : '📁 No image files uploaded yet'}
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm">📄 Upload Text Files</label>
            {/* Dropzone for Text Files */}
            <div
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files).filter(file =>
                  file.name.endsWith('.txt')
                );
                setTextFiles(files);
              }}
              onDragOver={(e) => e.preventDefault()}
              className="w-full border-2 border-dashed border-indigo-300 rounded-lg p-20 text-center bg-gray-50 hover:bg-indigo-50 cursor-pointer"
              onClick={() => document.getElementById('textInput').click()}
            >
              <input
                id="textInput"
                type="file"
                accept=".txt"
                multiple
                className="hidden"
                onChange={(e) => setTextFiles(Array.from(e.target.files || []))}
              />
              <p className="text-gray-500">📤 Drag & drop or click to upload <strong>.txt files</strong></p>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {textFiles.length > 0
                ? `✅ ${textFiles.length} text file${textFiles.length > 1 ? 's' : ''} uploaded`
                : '📁 No text files uploaded yet'}
            </div>

          </div>
        </div>


        <div>
          <h2 className="text-lg font-semibold mb-4">🕒 Schedule Times</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {schedules.map((post, index) => (
              <div key={index} className="flex gap-2 items-center mb-3">
                <input
                  type="datetime-local"
                  value={post.time || ''}
                  onChange={(e) => handleDateChange(index, e.target.value)}
                  className="border rounded px-2 py-1"
                />


                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => repeatPreviousDate(index)}
                    className="text-sm text-indigo-500 underline hover:text-indigo-700"
                  >
                    Repeat ⟳
                  </button>
                )}
              </div>
            ))}

          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full md:w-auto px-8 py-3 rounded-lg font-semibold text-white text-sm transition ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
          >
            {loading ? 'Uploading...' : '🚀 Schedule Posts'}
          </button>

          {status && (
            <p
              className={`text-sm font-medium ${status.includes('✅')
                ? 'text-emerald-600'
                : 'text-rose-600'
                }`}
            >
              {status}
            </p>
          )}

          {isDownloadReady && (
            <a
              href={`${process.env.NEXT_PUBLIC_API_CLIENT}/logs/messages.xlsx`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-indigo-500 hover:underline"
            >
              ⬇️ Download Scheduled Log
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
