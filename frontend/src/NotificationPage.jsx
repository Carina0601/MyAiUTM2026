import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";
import './PatientMonitor.css';

function timeAgo(timestamp) {
  if (!timestamp) return "";

  const now = Date.now();
  const time = new Date(timestamp).getTime();

  if (isNaN(time)) return "";

  const diff = Math.max(0, now - time);

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function isOld(timestamp) {
  if (!timestamp) return false;

  const time = new Date(timestamp).getTime();
  if (isNaN(time)) return false;

  const now = Date.now();
  const diff = now - time;

  return diff >= 30 * 60 * 1000;
}

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const notifRef = ref(db, "notifications");

    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setNotifications([]);
        return;
      }

      const list = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      list.reverse();
      setNotifications(list);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) => [...prev]);
    }, 60000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="background" style={{ marginTop: "5px" }}>
      <div className="dashboard-container">

        <div className="page-title">
          <h1 style={{ fontSize: '22px', fontWeight: '550', color: '#333' }}>
            ER Notifications
          </h1>
          <p style={{ fontSize: '16px', color: 'grey' }}>
            Real-time emergency alerts from paramedics
          </p>
        </div>

        {notifications.length === 0 && (
          <div className="empty-container" style={{
            marginTop: '20px',
            textAlign: 'center',
            padding: '80px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
            <p style={{ fontSize: '20px', fontWeight: '550', color: '#2e7d32' }}>
              No Notifications Yet
            </p>
            <p style={{ color: 'grey' }}>
              Incoming ER alerts will appear here
            </p>
          </div>
        )}

        <div style={{ marginTop: "20px" }}>
          {notifications.map((noti) => (
            <div
              key={noti.id}
              style={{
                position: "relative",
                padding: "18px",
                marginBottom: "15px",
                borderRadius: "12px",
                background: "#ffffff",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                transition: "0.2s ease",

                opacity: isOld(noti.timestamp) ? 0.7 : 1,
                filter: isOld(noti.timestamp) ? "grayscale(20%)" : "none",
              }}
            >
              {noti.timestamp && (
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "15px",
                    fontSize: "12px",
                    color: "gray"
                  }}
                >
                  {timeAgo(noti.timestamp)}
                </span>
              )}

              <h3 style={{ marginBottom: "8px", color: "#2e7d32" }}>
                {noti.doctor_type}
              </h3>

              <p style={{ margin: "4px 0" }}>
                <b>Patient:</b> {noti.patient_name}
              </p>

              <p style={{ margin: "4px 0" }}>
                <b>Age:</b> {noti.age}
              </p>

              <p style={{ margin: "6px 0", color: "#444" }}>
                {noti.message}
              </p>

              {noti.pdf_url && (
                <a
                  href={noti.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "10px",
                    padding: "8px 16px",
                    backgroundColor: "#2e7d32",
                    color: "white",
                    borderRadius: "20px",
                    textDecoration: "none",
                    fontSize: "14px"
                  }}
                >
                  📄 View Medical Report
                </a>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}