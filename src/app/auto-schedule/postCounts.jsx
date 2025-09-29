"use client";
import { useEffect, useState } from "react";

export default function PostStats() {
  const [channels, setChannels] = useState([]);
  const [allChannels, setAllChannels] = useState([]);
  const [totals, setTotals] = useState({ live: 0, scheduled: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [showDetailed, setShowDetailed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    fetchAvailableChannels();
  }, []);

  const fetchAvailableChannels = async () => {
    try {
      const mockChannels = [
        { id: "amazonindiaassociates", username: "@amazonindiaassociates", name: "Amazon India Associates" },
        { id: "Amazon_Associates_FashionBeauty", username: "@Amazon_Associates_FashionBeauty", name: "Amazon Associates FashionBeauty" },
        { id: "Amazon_Associates_HomeKitchen", username: "@Amazon_Associates_HomeKitchen", name: "Amazon Associates HomeKitchen" },
        { id: "Amazon_Associates_Consumables", username: "@Amazon_Associates_Consumables", name: "Amazon Associates Consumables" },
      ];
      setAllChannels(mockChannels);
      setSelectedChannels(mockChannels.map(ch => ch.id)); 
    //   setSelectedChannels(mockChannels[0].id); 
    } catch (err) {
      console.error("❌ Failed to load channels:", err);
    }
  };

  const fetchStats = async (date, channelIds) => {
    if (!channelIds || channelIds.length === 0) {
      setChannels([]);
      setTotals({ live: 0, scheduled: 0, total: 0 });
      return;
    }

    try {
      setLoading(true);
      const channelParam = channelIds.join(',');
      const res = await fetch(`${BASE_URL}/posts-summary?date=${date}&channels=${channelParam}`);
      const data = await res.json();
      const channelsData = data.channels || [];

      // Calculate totals
      const totalLive = channelsData.reduce((sum, ch) => sum + (ch.live_posts || 0), 0);
      const totalScheduled = channelsData.reduce((sum, ch) => sum + (ch.scheduled_posts || 0), 0);

      setChannels(channelsData);
      setTotals({ 
        live: totalLive, 
        scheduled: totalScheduled,
        total: totalLive + totalScheduled
      });
      
      // Set last updated time after successful fetch
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("❌ Failed to load post stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChannels.length > 0) {
      fetchStats(selectedDate, selectedChannels);
    }
  }, [selectedDate, selectedChannels]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleChannelToggle = (channelId) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSelectAllChannels = () => {
    setSelectedChannels(allChannels.map(ch => ch.id));
  };

  const handleDeselectAllChannels = () => {
    setSelectedChannels([]);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">📊 Post Statistics Dashboard</h1>
          
          {/* Controls Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Date Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  📅 Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-700 font-medium"
                />
                <p className="text-sm text-gray-600">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {/* Channel Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  📺 Select Channels ({selectedChannels.length}/{allChannels.length})
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={handleSelectAllChannels}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAllChannels}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-2">
                  {allChannels.map(channel => (
                    <label key={channel.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(channel.id)}
                        onChange={() => handleChannelToggle(channel.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {channel.username}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* View Toggle */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDetailed}
                  onChange={(e) => setShowDetailed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  🔍 Show Detailed View
                </span>
              </label>
            </div>
          </div>
        </div>

        {selectedChannels.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Channels Selected</h3>
            <p className="text-gray-500">Please select at least one channel to view statistics.</p>
          </div>
        ) : (
          <>
            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative">
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 rounded-xl flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600"></div>
                </div>
              )}
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Live Posts</p>
                    <p className="text-4xl font-bold text-green-600">{totals.live.toLocaleString()}</p>
                  </div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🟢</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Scheduled Posts</p>
                    <p className="text-4xl font-bold text-blue-600">{totals.scheduled.toLocaleString()}</p>
                  </div>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">⏰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Total Posts</p>
                    <p className="text-4xl font-bold text-purple-600">{totals.total.toLocaleString()}</p>
                  </div>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">📈</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Channel Stats Table */}
            {showDetailed && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden relative">
                {loading && (
                  <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading detailed data...</p>
                    </div>
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    📊 Detailed Channel Breakdown
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Channel
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Live Posts
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Scheduled
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Performance
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {channels.map((channel, index) => {
                        const channelTotal = (channel.live_posts || 0) + (channel.scheduled_posts || 0);
                        const livePercentage = channelTotal > 0 ? ((channel.live_posts || 0) / channelTotal * 100).toFixed(1) : 0;
                        
                        return (
                          <tr 
                            key={index} 
                            className="hover:bg-gray-50 transition-colors duration-200"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {channel.channel_username.charAt(1).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900">
                                    {channel.channel_username.replace("@", "")}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ID: {channel.channel_id}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 border border-green-200">
                                <span className="text-xl font-bold text-green-700">
                                  {(channel.live_posts ?? 0).toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 border border-blue-200">
                                <span className="text-xl font-bold text-blue-700">
                                  {(channel.scheduled_posts ?? 0).toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 border border-purple-200">
                                <span className="text-xl font-bold text-purple-700">
                                  {channelTotal.toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center space-y-1">
                                <span className="text-sm font-semibold text-gray-700">
                                  {livePercentage}% Live
                                </span>
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${livePercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {channel.error ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                  ⚠️ Error
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                  ✅ Active
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {channels.length === 0 && !loading && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-500 text-xl font-medium">No data found for selected date and channels</p>
                    <p className="text-gray-400 text-sm mt-2">Try selecting a different date or channels</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        {lastUpdated && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 bg-white rounded-full px-4 py-2 shadow-md inline-block">
              📅 Last updated: {lastUpdated}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}