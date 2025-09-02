'use client';
import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import TimePicker from 'react-time-picker';
import style from './autoSchedule.module.css'
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import gsheeticon from './google-sheets-icon.png'
import Image from 'next/image';

// Spinner Component
function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4h4z"
      />
    </svg>
  );
}

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
  const [showSubmit, setshowSubmit] = useState(false);
  const [success, setSuccess] = useState(null);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const [isTextDragOver, setIsTextDragOver] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  // const [submitLoading, setSubmitLoading] = useState(false);
  const [isPreviewed, setIsPreviewed] = useState(false);
  const [status, setStatus] = useState("");
  const [connected, setConnected] = useState(false);
  const [gshloading, setgshLoading] = useState(true);

  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [schedulingStats, setSchedulingStats] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [intervalOption, setIntervalOption] = useState(null);
  const [selectedStart, setSelectedStart] = useState(null);
const [selectedEnd, setSelectedEnd] = useState(null);
// Helper: normalize anything to "HH:mm" without forcing UTC
const toHHmm = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    // ISO string like "2025-09-02T10:15:00+05:30" or "...Z"
    if (value.includes("T")) return value.slice(11, 16);
    // "HH:mm" or "HH:mm:ss"
    if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  }
  if (value instanceof Date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`; // LOCAL time
  }
  // last resort
  try {
    const d = new Date(value);
    if (!isNaN(d)) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  } catch {}
  return "";
};

const handleSlotClick = (hhmm) => {
  // If no start yet OR both start+end already chosen → reset and pick new start
  if (!selectedStart || (selectedStart && selectedEnd)) {
    setSelectedStart(hhmm);
    setStartTime(hhmm);
    setSelectedEnd(null);
    setEndTime(null);
  } else {
    // Otherwise, trying to pick end
    if (hhmm === selectedStart) {
      // ⛔ Ignore if same as start
      toast.error("End time cannot be the same as start time");
      return;
    }
    setSelectedEnd(hhmm);
    setEndTime(hhmm);
  }
};

  const resetForm = () => {
    setTextFile(null);
    setImages([]);
    setResponse([]);
    setScheduledPosts([]);
    setDateType("today");
    setCustomDate("");
    setStartTime("10:00");
    setEndTime("11:00");
    setSchedulingStats(null);
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
  const handleTimeChange = (postNumber, newTime) => {
    console.log("clicked change time");

    console.log(postNumber, newTime);

    setResponse((prevResponse) =>
      prevResponse.map((post) =>
        post.post_number === postNumber
          ? { ...post, time: newTime, customTime: true }  // Add customTime flag here
          : post
      )
    );
  };


  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };
  const handlePreview = async () => {
    if (!textFile) return toast.error("Please upload a text file");
    if (images.length === 0) {
      toast.warning("No images uploaded. Only text posts will be scheduled.");
    }
    if (!startTime || !endTime || startTime >= endTime) return toast.error("Please provide valid start and end times");

    try {
      setPreviewLoading(true);

      const text = await readFileAsText(textFile);

      if (!text.includes('AMZ_TELEGRAM')) {
        toast.error('❌ Invalid file: Missing AMZ_TELEGRAM section.');
        setPreviewLoading(false);
        return;
      }

const postMatches = [...text.matchAll(
  /(post[\s\-_]*\**\s*(\d+)\s*\**)[\s\S]*?(?:(time\s*[:\-]\s*([0-9:\sampAMP]+))?[\s\S]*?(category\s*[:\-]?(.*?))?)?([\s\S]*?)(post[\s\-_]*\**\s*\2\s*\**[\s\S]*?(?:end|done|finish))/gi
)];

const parsedPosts = postMatches.map((match) => {
  const postNumber = parseInt(match[2]);   // ✅ use capture group 2 for number
  const rawContent = match[7].trim();      // ✅ use group 7 for content
  const lines = rawContent.split("\n");
  let category = null;
  let content = rawContent;
    let scheduledTime = null;


  // Extract TIME: HH:mm if present (case-insensitive)
  const timeLine = lines.find(l => /^time\s*[:\-]\s*\d{1,2}:\d{2}/i.test(l.trim()));
  if (timeLine) {
    scheduledTime = timeLine.match(/\d{1,2}:\d{2}/)[0];
    content = lines.filter(l => l.trim().toLowerCase() !== timeLine.trim().toLowerCase()).join("\n").trim();
  }
  if (lines[0]?.toLowerCase().startsWith("category:")) {
    category = lines[0].slice("category:".length).trim();
    content = lines.slice(1).join("\n").trim();
  }

  return {
    post_number: postNumber,
    text: content,
    category,
        scheduledTime,  // ✅ extracted per post

  };
});


// Merge text posts with images
const matched = parsedPosts.map((post) => {
  const imgMatch = images.find((img) =>
    new RegExp(`post[\\s-_]*${post.post_number}(?:[^\\d]*)\\.(jpg|jpeg|png|webp)$`, "i").test(img.name)
  );
  return {
    post_number: post.post_number,
    text: post.text,
    has_text: post.text.length > 0,
    has_image: !!imgMatch,
    category: post.category,
        scheduledTime: post.scheduledTime, // ✅ keep scheduledTime

  };
});

      const matchedPostNumbers = new Set(matched.map(p => p.post_number));
// Collect any images with no matching text post (image-only)
const extraImages = images.filter((img) => {
  const numberMatch = img.name.match(/post[\s-_]*(\d+)/i);
  if (!numberMatch) return false;
  const number = parseInt(numberMatch[1]);
  return !matched.some((p) => p.post_number === number);
});


// Final preview list
const previewPosts = [
  ...matched,
  ...extraImages.map((img) => {
    const number = parseInt(img.name.match(/post[\s-_]*(\d+)/i)[1]);
    return {
      post_number: number,
      text: "",           // no text
      has_text: false,
      has_image: true,
      image_only: true,   // ✅ flag image-only
            scheduledTime: null, // ✅ keep this key even for image-only

    };
  }),
].sort((a, b) => a.post_number - b.post_number);

// Warn but don't block preview
const imageOnly = previewPosts.filter(p => p.image_only);
if (imageOnly.length > 0) {
  toast.warning(`${imageOnly.length} post(s) only have images. They will be skipped.`);
}

      // 🕒 Default Time Distribution Logic
      const totalPosts = previewPosts.length;
      const startParts = startTime.split(':').map(Number);
      const endParts = endTime.split(':').map(Number);

      // Convert to minutes since midnight
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];

      let interval;
      if (intervalOption) {
        interval = intervalOption;  // use user-selected interval
      } else {
        interval = totalPosts > 1 ? Math.floor((endMinutes - startMinutes) / (totalPosts - 1)) : 0;
      }

      const postsWithTime = previewPosts.map((post, index) => {
        if (post.customTime) return post; // keep manually set times
          if (post.scheduledTime) return { ...post, time: post.scheduledTime, customTime: true };
          

        const minutes = startMinutes + interval * index;

        if (minutes > endMinutes) {
          return { ...post, time: null, customTime: false }; // mark unschedulable if exceeds end
        }

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
      setIsPreviewed(true)

    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setPreviewLoading(false);
    }
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
        if (post.image_only) return;  // 🚫 skip image-only
      finalForm.append("times[]", `${post.post_number}|${post.time}`);
    });

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auto-schedule`, finalForm);
      if (!res.data) {
        throw new Error("Invalid response from server");
      }
      console.log("Response from API:", res.data);
      setScheduledPosts(res.data.posts || []);
      setSchedulingStats({
        scheduled: res.data.scheduled || 0,
        failed: res.data.failed || 0,
        total: res.data.total || 0
      });
      setResponse(res.data);

      setBlockedTimes(res.data.blocked_times)
      setSuccess(`🎉 Successfully scheduled ${postCount} post${postCount > 1 ? 's' : ''}!`);
      setShowStatusModal(true);  // Show modal
      setError(null);
    } catch (err) {
      console.error(err);
      setError('❌ Failed to schedule posts');
      toast.error("Upload failed. Please try again.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setshowSubmit(false)
    }
  };
  // Function to get status badge color and icon
  const getStatusBadge = (status, error) => {
    switch (status) {
      case 'scheduled':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          icon: '✅',
          label: 'Scheduled'
        };
      case 'failed':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          icon: '❌',
          label: 'Failed'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          icon: '⏳',
          label: 'Unknown'
        };
    }
  };
const checkOrConnectSheets = async (reconnect = false) => {
    setgshLoading(true);
    setStatus(reconnect ? "Reconnecting..." : "Checking connection...");
    try {
      const res = await axios.post(`${BASE_URL}/sheets/connect-or-check`, { reconnect });
      setConnected(res.data.connected);
      setStatus(res.data.message);
    } catch (err) {
      setConnected(false);
      setStatus("⚠️ Error: " + err.message);
    } finally {
      setgshLoading(false);
    }
  };

  useEffect(() => {
    // Check status on page load
    checkOrConnectSheets(false);
  }, []);
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 border rounded-xl shadow-xl bg-white text-[#000] space-y-6">
      <div className="p-4 border rounded-xl shadow-md flex items-center justify-between">
  <div className="flex items-center gap-2">
    <span className="text-xl" title="Google Sheets">
      <Image src={gsheeticon} alt="Google Sheets" className="w-8 h-8" />
    </span>
    {/* Small indicator "blub" */}
    <span
      className={`w-3 h-3 rounded-full transition-colors ${
        connected ? "bg-green-500" : "bg-red-500"
      }`}
      title={connected ? "Connected" : "Not Connected"}
    ></span>
  </div>

  <button
    onClick={() => checkOrConnectSheets(true)}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
    disabled={gshloading}
  >
    {gshloading
      ? "Please wait..."
      : connected
      ? "Reconnect Sheets"
      : "Connect Sheets"}
  </button>
</div>

<p className="mt-2 text-sm">{status}</p>

      <h2 className="text-2xl font-bold text-[#000]">📅 Auto Scheduler with Preview</h2>

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
                {/*{post.category && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">🏷️ {post.category}</span>}*/}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600">🕒 Schedule Time</label>
                <p>
                  Time:
                  <input
                    type="time"
                    value={post.time}
                    onChange={(e) => handleTimeChange(post.post_number, e.target.value)}
                    className="border rounded px-2 py-1"
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
          <div className="flex flex-col">
            <label className="block font-semibold mb-1">Start Time</label>
            {/* <div className="p-2 border rounded w-[130px] bg-white"> */}
            <TimePicker
              onChange={setStartTime}
              value={startTime}
              format="HH:mm"
              clearIcon={null}
              clockIcon={null}
              disableClock={true}
            />
            {/* </div> */}
          </div>

          <div className="flex flex-col">
            <label className="block font-semibold mb-1">End Time</label>
            {/* <div className="p-2 border rounded w-[130px] bg-white"> */}
            <TimePicker
              onChange={setEndTime}
              value={endTime}
              format="HH:mm"
              clearIcon={null}
              clockIcon={null}
              disableClock={true}
            />
            {/* </div> */}
          </div>
        </div>
        <div className="flex flex-col mt-4">
          <label className="block font-semibold mb-1">Interval</label>
          <select
            className="p-2 border rounded bg-white"
            value={intervalOption || ""}
            onChange={(e) => setIntervalOption(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Auto (Evenly Distributed)</option>
            <option value="5">Every 5 minutes</option>
            <option value="10">Every 10 minutes</option>
            <option value="15">Every 15 minutes</option>
            <option value="30">Every 30 minutes</option>
          </select>
        </div>


      </div>
      <button
        onClick={handlePreview}
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2
        py-2 px-4 rounded font-semibold text-white
        transition duration-200 ease-in-out cursor-pointer
        ${loading
            ? "bg-blue-400 cursor-not-allowed animate-pulse"
            : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          }
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      >
        🔍 Preview Posts and Confirm
      </button>
      <button
        onClick={() => setshowSubmit(true)}
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2
        py-2 px-4 rounded font-semibold text-white
        transition duration-200 ease-in-out cursor-pointer
        ${loading
            ? "bg-blue-400 cursor-not-allowed animate-pulse"
            : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          }
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      >
        {loading ? (
          <>
            <Spinner />
            Scheduling...
          </>
        ) : (
          <>
            🗓️ Schedule
          </>
        )}
      </button>
{response?.time_slots && (
  <div className="mt-6">
    <h3 className="font-semibold text-lg text-gray-800 mb-3">⏰ Time Slots</h3>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {response.time_slots.map((slot, idx) => {
        const isBlocked = slot.status === "blocked";

        // Normalize every time to "HH:mm"
        const timeStr = toHHmm(slot.time);
        const startStr = toHHmm(selectedStart);
        const endStr = toHHmm(selectedEnd);

        const isST = startStr === timeStr;
        const isET = endStr === timeStr;

        return (
          <div
            key={idx}
            className={`
              relative flex flex-col items-center justify-center p-4 rounded-xl shadow-sm cursor-pointer transition
              ${isBlocked ? "bg-red-100 text-red-700 border border-red-300" : "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"}
              ${isST || isET ? "ring-2 ring-blue-500" : ""}
            `}
            onClick={() => {
              if (isBlocked) return toast.error("This slot is blocked");
              // Pass HH:mm to the handler to avoid any timezone conversion
              handleSlotClick(timeStr);
            }}
          >
            <span className="text-sm font-medium">{timeStr}</span>
            <span className="text-xs mt-1">{isBlocked ? "⛔ Blocked" : "✅ Free"}</span>

            {isST && (
              <span className="absolute top-1 right-2 text-green-700 font-bold text-xs border border-green-700 rounded-full px-2 py-0.5">
                ST
              </span>
            )}
            {isET && (
              <span className="absolute top-1 right-2 text-green-700 font-bold text-xs border border-green-700 rounded-full px-2 py-0.5">
                ET
              </span>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}




      <Dialog open={showSubmit} onOpenChange={setshowSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-yellow-600">🚨 Confirm Auto-Schedule</DialogTitle>
          </DialogHeader>
          <p className="mb-2">
            Schedule 3 posts between <strong>{postCount}</strong> post{postCount > 1 ? 's' : ''} between{' '}
            <strong>{startTime}</strong> and <strong>{endTime}</strong>? <br />
            Click <b className="text-[red]">Cancel</b> to schedule posts manually.
          </p>
          <div className="flex justify-end gap-4 mt-4">
            <button className="px-4 py-2 bg-red-600 rounded text-white" onClick={() => setshowSubmit(false)}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              type="submit"
              disabled={loading}
              style={{ textWrap: "nowrap" }}
              className={`flex gap-3 px-11 py-2 bg-green-600 rounded font-semibold text-white
              transition duration-200 ease-in-out cursor-pointer
              ${loading
                  ? "bg-green-400 cursor-not-allowed animate-pulse"
                  : "bg-green-600 hover:bg-green-700 active:scale-95"
                }
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              {loading ? (
                <>
                  <Spinner />
                  Scheduling...
                </>
              ) : (
                <>
                  Confirm
                </>
              )}
            </button>

          </div>
        </DialogContent>
      </Dialog>

      {/* 🎉 Success Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-600">📊 Scheduling Results</DialogTitle>
          </DialogHeader>

          {/* Summary Stats */}
          {schedulingStats && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">📈 Summary</h3>
              <div className="flex gap-4 text-sm">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded">
                  ✅ Scheduled: {schedulingStats.scheduled}
                </span>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded">
                  ❌ Failed: {schedulingStats.failed}
                </span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">
                  📊 Total: {schedulingStats.total}
                </span>
              </div>
            </div>
          )}

          {/* Individual Post Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledPosts.map((post, idx) => {
              const statusBadge = getStatusBadge(post.status, post.error);
              return (
                <div key={`${post.image || post.text || 'unknown'}-${post.time}`} className="border rounded-lg p-4 shadow bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-bold text-gray-700">Post #{post.post}</h3>
                    <span className={`${statusBadge.bg} ${statusBadge.text} px-2 py-1 rounded text-sm font-medium`}>
                      {statusBadge.icon} {statusBadge.label}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {/* {post.image && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">🖼️ {post.image}</span>}
                      {post.text && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">📝 Text</span>} */}
                      {/* {post.category && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">🏷️ {post.category}</span>} */}
                    </div>

                    <p className="text-gray-600">
                      <strong>Time:</strong> {post.time}
                    </p>

                    {/* {post.text && (
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <strong>Content:</strong> {post.text.length > 100 ? post.text.substring(0, 100) + '...' : post.text}
                      </div>
                    )} */}

                    {post.error && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-2 text-xs">
                        <strong className="text-red-700">Error:</strong> {post.error}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            {/* <Button onClick={() => { setShowStatusModal(false); resetForm(); }} className="bg-blue-600">
              Schedule More Posts
            </Button> */}
            <Button onClick={() => setShowStatusModal(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}