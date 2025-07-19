"use client";
import React, { useState, useEffect } from "react";
// Firebase SDK import
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";

// TODO: 아래 firebaseConfig를 본인 프로젝트 정보로 교체하세요
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "https://bap-momok-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  // ...etc
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function ParticipatePage({ params }: { params: { group_id: string } }) {
  const [showNicknameModal, setShowNicknameModal] = useState(true);
  const [nickname, setNickname] = useState("");
  const [participants, setParticipants] = useState({});

  // 항상 모달이 뜨도록, localStorage에 저장되어 있어도 자동으로 닫히지 않음

  const handleNicknameSubmit = async () => {
    if (nickname.trim()) {
      localStorage.setItem("nickname", nickname.trim());
      try {
        const response = await fetch(
          `http://localhost:8000/groups/${params.group_id}/participants`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nickname: nickname.trim() }),
          }
        );
        const result = await response.json();
        if (result.participant_id) {
          localStorage.setItem("participant_id", result.participant_id);
          setShowNicknameModal(false);
        } else {
          alert("참가 등록 실패");
        }
      } catch (e) {
        alert("에러 발생");
      }
    }
  };

  useEffect(() => {
    const participantsRef = ref(db, `groups/${params.group_id}/participants`);
    const unsubscribe = onValue(participantsRef, (snapshot) => {
      setParticipants(snapshot.val() || {});
    });
    return () => off(participantsRef, "value", unsubscribe);
  }, [params.group_id]);

  return (
    <div>
      {showNicknameModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 32, minWidth: 300, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2 style={{ marginBottom: 16, color: '#222' }}>닉네임을 입력하세요</h2>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="닉네임"
              style={{
                fontSize: 18,
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #ccc",
                marginBottom: 16,
                width: "100%",
                color: '#222',
                outline: 'none',
              }}
              onFocus={e => {
                e.target.style.border = '2px solid #994d52';
                e.target.style.boxShadow = '0 0 0 2px rgba(153,77,82,0.15)';
              }}
              onBlur={e => {
                e.target.style.border = '1px solid #ccc';
                e.target.style.boxShadow = 'none';
              }}
              onKeyDown={e => { if (e.key === "Enter") handleNicknameSubmit(); }}
              autoFocus
            />
            <button
              onClick={handleNicknameSubmit}
              style={{ background: "#994d52", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
            >
              확인
            </button>
          </div>
        </div>
      )}
      {!showNicknameModal && (
        <div style={{ padding: 40, textAlign: "center", fontSize: 32 }}>
          {/* QR, 인원수, 닉네임 리스트 등 원하는 UI로 확장 가능 */}
          <div style={{ fontSize: 18, marginBottom: 16 }}>인원: {Object.keys(participants).length}명</div>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 16 }}>
            {Object.values(participants).map((p: any, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>{p.nickname}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 