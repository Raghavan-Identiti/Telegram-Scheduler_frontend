"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function ScheduledPostExtractor() {
  const [channel, setChannel] = useState("@amazonindiaassociates");
  const [dateOption, setDateOption] = useState("today");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

  const formatDateTimeLocal = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateOption === "today") {
      const start = new Date(today);
      const end = new Date(today); end.setHours(23,59,59);
      setStartTime(formatDateTimeLocal(start));
      setEndTime(formatDateTimeLocal(end));
    } else if (dateOption === "yesterday") {
      const start = new Date(yesterday);
      const end = new Date(yesterday); end.setHours(23,59,59);
      setStartTime(formatDateTimeLocal(start));
      setEndTime(formatDateTimeLocal(end));
    }
  }, [dateOption]);

  const fetchScheduledPosts = async () => {
    if (!channel || !startTime || !endTime) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");
      setPosts([]);
      const res = await axios.post(`${BASE_URL}/scheduled-posts`, {
        channel,
        start_time: startTime,
        end_time: endTime
      });
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch scheduled posts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-4">📅 Scheduled Post Extractor</h1>

        {/* Channel Selection */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="@amazonindiaassociates">@amazonindiaassociates</option>
            <option value="@Amazon_Associates_FashionBeauty">@Amazon Fashion & Beauty</option>
            <option value="@Amazon_Associates_HomeKitchen">@Amazon Home & Kitchen</option>
            <option value="@Amazon_Associates_Consumables">@Amazon Consumables</option>
          </select>
        </div>

        {/* Date Option Buttons */}
        <div className="mb-4 flex gap-2">
          {["today","yesterday","custom"].map(opt => (
            <button
              key={opt}
              onClick={() => setDateOption(opt)}
              className={`px-3 py-1 text-sm rounded ${
                dateOption===opt ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        {dateOption==="custom" && (
          <>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Start Date & Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e)=>setStartTime(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">End Date & Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e)=>setEndTime(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </>
        )}

        {errorMsg && <div className="mb-3 p-2 text-red-700 bg-red-100 rounded">{errorMsg}</div>}

        <button
          onClick={fetchScheduledPosts}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "⏳ Loading..." : "Fetch Scheduled Posts"}
        </button>
      </div>

      {/* Scheduled Posts Display */}
      <div className="w-full max-w-4xl mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1"><strong>ID:</strong> {p.id}</p>
            <p className="text-sm text-gray-600 mb-1"><strong>Scheduled Time:</strong> {new Date(p.scheduled_time).toLocaleString()}</p>
            <p className="text-gray-800 whitespace-pre-wrap">{p.text}</p>
            {p.links?.length>0 && (
              <ul className="mt-2 space-y-1">
                {p.links.map((l,i)=>(
                  <li key={i}><a href={l} target="_blank" className="text-blue-600 hover:underline">{l}</a></li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
