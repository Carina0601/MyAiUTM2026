import React, { useEffect, useState } from 'react';
import './SummaryPage.css';
import { storage } from './firebase';
import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";

export default function SummaryPage() {
  const [files, setFiles] = useState([]);
  const [readFiles, setReadFiles] = useState([]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("readFiles")) || [];
    setReadFiles(stored);
  }, []);

  const markAsRead = (fileName) => {
    const updated = [...new Set([...readFiles, fileName])];
    setReadFiles(updated);
    localStorage.setItem("readFiles", JSON.stringify(updated));
  };

  useEffect(() => {
    let interval;

    const fetchFiles = async () => {
      try {
        const folderRef = ref(storage, 'pdfs/');
        const res = await listAll(folderRef);

        const fileList = await Promise.all(
          res.items.map(async (item) => {
            const url = await getDownloadURL(item);
            const metadata = await getMetadata(item);

            return {
              name: item.name,
              url,
              timeCreated: metadata.timeCreated
            };
          })
        );

        const sortedFiles = fileList.sort(
          (a, b) => new Date(b.timeCreated) - new Date(a.timeCreated)
        );

        setFiles(sortedFiles);
      } catch (err) {
        console.error("Error fetching files:", err);
      }
    };

    fetchFiles();

    interval = setInterval(fetchFiles, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="background">
      <div className="dashboard-container">

        <div className="page-title">
          <h1>Emergency Case Summary</h1>
          <p>Generative AI analysis of patient vitals</p>
        </div>

        <div className="content-area">
          {files.length === 0 ? (
            <p className="empty-text">Loading...</p>
          ) : (
            <div className="file-grid">
              {files.map((file, index) => {
                const isRead = readFiles.includes(file.name);

                return (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-link"
                    onClick={() => markAsRead(file.name)}
                  >
                    <div className={`report ${isRead ? "read" : ""}`}>
                      <span className="file-name">
                        📄 {file.name}
                      </span>

                      <span className="file-date">
                        {formatDate(file.timeCreated)}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}