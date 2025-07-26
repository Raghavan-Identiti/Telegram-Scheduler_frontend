'use client';
import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AutoSchedule() {
  const [dateType, setDateType] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [textFile, setTextFile] = useState(null);
  const [images, setImages] = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [response, setResponse] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const [isTextDragOver, setIsTextDragOver] = useState(false);

  const resetForm = () => {
    setTextFile(null);
    setImages([]);
    setPosts([]);
    setDateType("today");
    setCustomDate("");
    setStartTime("");
    setEndTime("");
  };
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

  const handleImageDrop = (e) => {
    e.preventDefault();
    setIsImageDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setImages((prev) => [...prev, ...files]);
  };

  const handleTextDrop = (e) => {
    e.preventDefault();
    setIsTextDragOver(false);
    const file = e.dataTransfer.files[0];
    setTextFile(file);
  };

  const handlePreview = async () => {
    if (!textFile) return toast.error("Please upload a text file");

    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;

      if (!text.includes('AMZ_TELEGRAM')) return toast.error('❌ Invalid file: Missing AMZ_TELEGRAM section.');

      const postMatches = [...text.matchAll(/post-(\d+)\n([\s\S]*?)post-\1 end/gi)];
      const parsedPosts = postMatches.map((match) => {
        const postNumber = parseInt(match[1]);
        const rawContent = match[2].trim();
        const lines = rawContent.split('\n');
        let category = null;
        let content = rawContent;

        if (lines[0]?.toLowerCase().startsWith('category:')) {
          category = lines[0].slice('category:'.length).trim();
          content = lines.slice(1).join('\n').trim();
        }

        return {
          post_number: postNumber,
          text: content,
          category,
        };
      });


      const matched = parsedPosts.map((post) => {
        const imgMatch = images.find((img) =>
          new RegExp(`post[-_]?${post.post_number}\\.(jpg|jpeg|png|webp)`, 'i').test(img.name)
        );
        return {
          post_number: post.post_number,
          has_text: post.text.length > 0,
          has_image: !!imgMatch,
          category: post.category,
        };
      });

      const extraImages = images.filter((img) => {
        const numberMatch = img.name.match(/post[-_]?(\d+)\.(jpg|jpeg|png|webp)/i);
        if (!numberMatch) return false;
        const number = parseInt(numberMatch[1]);
        return !parsedPosts.find((p) => p.post_number === number);
      });

      const previewPosts = [
        ...matched,
        ...extraImages.map((img) => {
          const number = parseInt(img.name.match(/post[-_]?(\d+)/i)[1]);
          return {
            post_number: number,
            has_text: false,
            has_image: true,
          };
        }),
      ].sort((a, b) => a.post_number - b.post_number);

      // 🕒 Default Time Distribution Logic
      const totalPosts = previewPosts.length;
      const startParts = startTime.split(':').map(Number);
      const endParts = endTime.split(':').map(Number);

      // Convert to minutes since midnight
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];

      const interval = totalPosts > 1 ? Math.floor((endMinutes - startMinutes) / (totalPosts - 1)) : 0;

      const postsWithTime = previewPosts.map((post, index) => {
        const minutes = startMinutes + interval * index;
        const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
        const mins = String(minutes % 60).padStart(2, '0');
        return {
          ...post,
          time: `${hours}:${mins}`,
          customTime: false,
        };
      });


      setPostCount(postsWithTime.length);
      setResponse(postsWithTime);
      setError(null);
      setShowConfirm(true);
    };

    reader.onerror = function () {
      setError('❌ Failed to read text file');
    };

    reader.readAsText(textFile);
  };

  const handleSubmit = async () => {
    const finalForm = new FormData();
    finalForm.append('text_files', textFile);
    images.forEach((img) => finalForm.append('image_files', img));

    const today = new Date();
    let selectedDate;

    if (dateType === 'today') {
      selectedDate = today.toISOString().split('T')[0];
    } else if (dateType === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      selectedDate = tomorrow.toISOString().split('T')[0];
    } else {
      selectedDate = customDate;
    }

    const fullStart = `${selectedDate}T${startTime}`;
    const fullEnd = `${selectedDate}T${endTime}`;

    finalForm.append('start_time', fullStart);
    finalForm.append('end_time', fullEnd);
    response.forEach((post) => {
      finalForm.append("times[]", `${post.post_number}|${post.time}`);
    });

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auto-schedule`, finalForm);
      setResponse(res.data);
      setSuccess(`🎉 Successfully scheduled ${postCount} post${postCount > 1 ? 's' : ''}!`);
      setShowSuccessModal(true);  // Show modal
      setError(null);
    } catch (err) {
      console.error(err);
      setError('❌ Failed to schedule posts');
      toast.error("Upload failed. Please try again.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 border rounded-xl shadow-xl bg-white text-[#000] space-y-6">
      <h2 className="text-2xl font-bold text-[#000]">📅 Auto Scheduler with Preview</h2>

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 font-semibold text-gray-700">Upload Images</label>
          <input type="file" multiple accept="image/*" onChange={(e) => setImages([...e.target.files])} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-700">Upload Text File</label>
          <input type="file" accept=".txt" onChange={(e) => setTextFile(e.target.files[0])} className="w-full p-2 border rounded" />
        </div>
      </div> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className='flex flex-col gap-y-3'>
          <div
            onDrop={handleImageDrop}
            onDragOver={(e) => e.preventDefault()}
            className="w-full p-9 border-2 border-dashed rounded text-center cursor-pointer bg-gray-50"
          >
            <p className="font-semibold mb-2">📤 Drag & Drop or Click to Upload Images</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages([...e.target.files])}
              className="w-full p-2 border rounded"
            />
          </div>
          <ul>
            {images.map((img, idx) => (
              <li key={idx}>🖼️ {img.name}</li>
            ))}
          </ul>
        </div>

        <div className='flex flex-col gap-y-3'>
          <div
            onDrop={handleTextDrop}
            onDragOver={(e) => e.preventDefault()}
            className="w-full p-9 border-2 border-dashed rounded text-center cursor-pointer bg-gray-50"
          >
            <p className="font-semibold mb-2">📥 Drag & Drop or Click to Upload Text File</p>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => setTextFile(e.target.files[0])}
              className="w-full p-2 border rounded"
            />
          </div>
          <span>{textFile && `📄 ${textFile.name}`}</span>
        </div>

      </div>

      <button onClick={handlePreview} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded">🔍 Preview Posts</button>

      {postCount !== null && (
        <p className="text-lg font-medium text-gray-800">📦 Total Posts: <span className="font-bold">{postCount}</span></p>
      )}

      {response && response.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {response.map((post, idx) => (
            <div key={idx} className="border rounded-lg p-4 shadow bg-gray-50">
              <h3 className="text-lg font-bold text-gray-700">Post #{post.post_number}</h3>

              <div className="flex items-center gap-2 mt-2">
                {post.has_text && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">📝 Text</span>}
                {post.has_image && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">🖼️ Image</span>}
                {!post.has_image && !post.has_text && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">🚫 Empty</span>}
                {post.category && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">🏷️ {post.category}</span>}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600">🕒 Schedule Time</label>
                <p>
                  Time:
                  <input
                    type="time"
                    value={post.time}
                    onChange={(e) => {
                      const newTime = e.target.value;
                      const updated = [...response];
                      updated[idx].time = newTime;
                      updated[idx].customTime = true; // user-edited
                      setResponse(updated);
                    }}
                  />
                </p>
              </div>
            </div>
          ))}
        </div>

      )}

      {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">🗓️ Schedule Time</h3>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex gap-4 items-center">
            <label><input type="radio" value="today" checked={dateType === 'today'} onChange={() => setDateType('today')} /> Today</label>
            <label><input type="radio" value="tomorrow" checked={dateType === 'tomorrow'} onChange={() => setDateType('tomorrow')} /> Tomorrow</label>
            <label><input type="radio" value="custom" checked={dateType === 'custom'} onChange={() => setDateType('custom')} /> Custom</label>
          </div>
          {dateType === 'custom' && (
            <input type="date" className="p-2 border rounded" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
          )}
        </div>

        <div className="flex gap-6 mt-4">
          <div>
            <label className="block font-semibold mb-1">Start Time</label>
            <input type="time" className="p-2 border rounded" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold mb-1">End Time</label>
            <input type="time" className="p-2 border rounded" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowConfirm(true)}
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
        disabled={loading || !postCount}
      >
        {loading ? '⏳ Scheduling...' : '🧠 Validate & Confirm'}
      </button>

      {/* {showConfirm && (
        <div className="mt-4 p-4 border rounded bg-green-50">
          <p className="mb-3 font-medium text-gray-700">✅ Confirm scheduling <strong>{postCount}</strong> posts between <strong>{startTime}</strong> and <strong>{endTime}</strong>?</p>
          <div className="flex gap-4">
            <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">✅ Yes, Schedule</button>
            <button onClick={() => setShowConfirm(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      )} */}
      {/* 🔁 Confirmation Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-yellow-600">🚨 Confirm Auto-Schedule</DialogTitle>
          </DialogHeader>
          <p className="mb-2">
            Do you want to schedule <strong>{postCount}</strong> post{postCount > 1 ? 's' : ''} between{' '}
            <strong>{startTime}</strong> and <strong>{endTime}</strong>?
          </p>
          <div className="flex justify-end gap-4 mt-4">
            <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowConfirm(false)}>
              Cancel
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSubmit}>
              ✅ Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🎉 Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">✅ Success</DialogTitle>
          </DialogHeader>
          <p>{success}</p>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowSuccessModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}