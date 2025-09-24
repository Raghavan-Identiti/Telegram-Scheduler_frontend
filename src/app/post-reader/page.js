"use client";
import { useState } from "react";
import axios from "axios";

export default function PostReader() {
  const [channel, setChannel] = useState("@amazonindiaassociates"); // default value
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

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

        {/* Dropdown instead of text input */}
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="w-full mb-3 p-2 border rounded focus:ring focus:ring-blue-200"
        >
          <option value="@amazonindiaassociates">@amazonindiaassociates</option>
          <option value="@Amazon_Associates_FashionBeauty">@Amazon_Associates_FashionBeauty</option>
          <option value="@Amazon_Associates_HomeKitchen">{"@Home & Kitchen (Amazon Associates)"}</option>
          <option value="@Amazon_Associates_Consumables">{"@Consumables (Amazon Associates)"}</option>
        </select>

        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full mb-3 p-2 border rounded focus:ring focus:ring-blue-200"
        />

        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full mb-3 p-2 border rounded focus:ring focus:ring-blue-200"
        />

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
            No posts found. Enter details and click "Read Posts".
          </p>
        )}
      </div>
      <div>
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
            <div key={p.id} className="border-b pb-3">
              <p><strong>ID:</strong> {p.id}</p>
              <p><strong>Time:</strong> {readableTime} IST</p>
              <p><strong>Views:</strong> {p.views}</p>
              <p><strong>Text:</strong> {p.text}</p>


              {p.links && p.links.length > 0 && (
                <div>
                  <strong>Links:</strong>
                  <ul>
                    {(Array.isArray(p.links) ? p.links : []).map((link, i) => (
                      <li key={i}>
                        <a
                          href={link.startsWith("http") ? link : `https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
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
