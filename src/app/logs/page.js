// src/app/logs/page.jsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download } from 'lucide-react';

export default function LogsPage() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE;
  useEffect(() => {
    axios.get(`${BASE_URL}/logs`).then((res) => setFiles(res.data));
  }, []);

  const handlePreview = async (filename) => {
    const res = await axios.get(`${BASE_URL}/logs/${filename}`);
    setSelectedFile(filename);
    setPreviewData(res.data);
  };

  const handleDownload = (filename) => {
    window.open(`${BASE_URL}/logs/download/${filename}`, '_blank');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📁 Logs</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Uploaded Files</h2>
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.name} className="flex justify-between items-center border p-2 rounded">
              <span>{file.name}</span>
              <div className="flex gap-3">
                <button onClick={() => handlePreview(file.name)}>
                  <Eye className="w-5 h-5 text-blue-600 hover:scale-110 transition" />
                </button>
                <button onClick={() => handleDownload(file.name)}>
                  <Download className="w-5 h-5 text-green-600 hover:scale-110 transition" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {previewData.length > 0 && (
        <div className="border p-4 rounded shadow bg-white">
          <h2 className="text-lg font-semibold mb-3">Preview: {selectedFile}</h2>
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(previewData[0]).map((header, i) => (
                    <TableHead key={i}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((row, i) => (
                  <TableRow key={i}>
                    {Object.values(row).map((cell, j) => (
                      <TableCell key={j}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
