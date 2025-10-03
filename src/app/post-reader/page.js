"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function PostReader() {
  const [channel, setChannel] = useState("@amazonindiaassociates");
  const [dateOption, setDateOption] = useState("today"); // today, yesterday, custom
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Set date ranges based on selected option
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateOption === "today") {
      const startOfDay = new Date(today);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59);
      
      setStartTime(formatDateTimeLocal(startOfDay));
      setEndTime(formatDateTimeLocal(endOfDay));
    } else if (dateOption === "yesterday") {
      const startOfDay = new Date(yesterday);
      const endOfDay = new Date(yesterday);
      endOfDay.setHours(23, 59, 59);
      
      setStartTime(formatDateTimeLocal(startOfDay));
      setEndTime(formatDateTimeLocal(endOfDay));
    }
    // For custom, we don't auto-set the times
  }, [dateOption]);

  const fetchPosts = async () => {
    if (!channel || !startTime || !endTime) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setPosts([]);
      
      const res = await axios.post(`${BASE_URL}/read-posts`, {
        channel,
        start_time: startTime,
        end_time: endTime,
      });
      
      setPosts(res.data.posts || []);
    } catch (error) {
      console.error("❌ API Error:", error);
      setErrorMsg(
        error.response?.data?.detail ||
        "Failed to fetch posts. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-4">📖 Telegram Post Reader</h1>
        
        {/* Channel Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Channel:
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
          >
            <option value="@amazonindiaassociates">@amazonindiaassociates</option>
            <option value="@Amazon_Associates_FashionBeauty">@Amazon_Associates_FashionBeauty</option>
            <option value="@Amazon_Associates_HomeKitchen">@Home & Kitchen (Amazon Associates)</option>
            <option value="@Amazon_Associates_Consumables">@Consumables (Amazon Associates)</option>
            <option value="@amazoninfluencerprogramindia">@AIP (Amazon Influencer Program India)</option>
          </select>
        </div>

        {/* Date Range Options */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date Range:
          </label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setDateOption("today")}
              className={`px-3 py-1 text-sm rounded ${
                dateOption === "today"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateOption("yesterday")}
              className={`px-3 py-1 text-sm rounded ${
                dateOption === "yesterday"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateOption("custom")}
              className={`px-3 py-1 text-sm rounded ${
                dateOption === "custom"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Date Time Inputs */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date & Time:
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={dateOption !== "custom"}
            className={`w-full p-2 border rounded focus:ring focus:ring-blue-200 ${
              dateOption !== "custom" ? "bg-gray-100" : ""
            }`}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date & Time:
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={dateOption !== "custom"}
            className={`w-full p-2 border rounded focus:ring focus:ring-blue-200 ${
              dateOption !== "custom" ? "bg-gray-100" : ""
            }`}
          />
        </div>

        {/* Current Selection Display */}
        {dateOption !== "custom" && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <strong>Selected Range:</strong> {dateOption === "today" ? "Today" : "Yesterday"}
            <br />
            <span className="text-gray-600">
              {startTime && new Date(startTime).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })} - {endTime && new Date(endTime).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-3 p-2 text-red-700 bg-red-100 border border-red-300 rounded">
            {errorMsg}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={fetchPosts}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "⏳ Loading..." : "Read Posts"}
        </button>

        {/* Empty State */}
        {!loading && posts.length === 0 && !errorMsg && (
          <p className="mt-4 text-gray-500 text-center">
            No posts found. Select options and click &quot; Read Posts &quot;.
          </p>
        )}
      </div>

      {/* Posts Display */}
      <div className="w-full max-w-4xl mt-6">
        {posts.map((p) => {
          const dateObj = new Date(p.time);
          const readableTime = dateObj.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          return (
            <div key={p.id} className="bg-white p-4 mb-4 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-gray-600">
                  <strong>ID:</strong> {p.id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Views:</strong> {p.views}
                </p>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                <strong>Time:</strong> {readableTime} IST
              </p>
              
              <div className="mb-3">
                <strong className="text-gray-700">Text:</strong>
                <p className="mt-1 text-gray-800 whitespace-pre-wrap">{p.text}</p>
              </div>
              
              {p.links && p.links.length > 0 && (
                <div>
                  <strong className="text-gray-700">Links:</strong>
                  <ul className="mt-1 space-y-1">
                    {(Array.isArray(p.links) ? p.links : []).map((link, i) => (
                      <li key={i}>
                        <a
                          href={link.startsWith("http") ? link : `https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}