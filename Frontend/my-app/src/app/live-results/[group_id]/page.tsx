"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { database } from "@/firebase";
import { ref, onValue, off } from "firebase/database";

// participate 페이지와 동일한 firebaseConfig 사용
export default function LiveResultsPage() {
  const params = useParams();
  const groupId = params.group_id;
  const [candidates, setCandidates] = useState<any[]>([]);
  const [groupData, setGroupData] = useState<any>(null);
  const [votingProgress, setVotingProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!groupId) return;
    // 후보 실시간 업데이트 (Firebase)
    const candidatesRef = ref(database, `groups/${groupId}/candidates`);
    const unsubscribe = onValue(candidatesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.entries(data).map(([id, c]: any) => ({
        id,
        ...c,
        score:
          (c.good || 0) * 1 +
          (c.soso || 0) * 0 +
          (c.bad || 0) * -2 +
          (c.never || 0) * -999,
      }));
      arr.sort((a, b) => b.score - a.score);
      arr.forEach((c, i) => (c.rank = i + 1));
      setCandidates(arr);
    });

    // 투표 진행률 및 그룹 정보 (백엔드)
    const fetchData = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        const groupResponse = await fetch(`${BACKEND_URL}/groups/${groupId}`);
        const groupData = await groupResponse.json();
        setGroupData(groupData);
        // 투표 진행률 계산
        const participantsObj = groupData.participants || {};
        const totalParticipants = Object.keys(participantsObj).length;
        const completedParticipants = Object.values(participantsObj).filter((p: any) => p.vote_complete).length;
        const progress = totalParticipants > 0 ? (completedParticipants / totalParticipants) * 100 : 0;
        setVotingProgress(progress);
      } catch (error) {
        console.error("데이터 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => {
      off(candidatesRef, "value", unsubscribe);
      clearInterval(interval);
    };
  }, [groupId]);

  console.log("candidates state:", candidates);

  const medalColors = [
    'linear-gradient(90deg, #FFD700 0%, #FFEF8A 100%)', // 금
    'linear-gradient(90deg, #C0C0C0 0%, #E0E0E0 100%)', // 은
    'linear-gradient(90deg, #CD7F32 0%, #E3B778 100%)', // 동
  ];

  const medalEmojis = ['🥇', '🥈', '🥉'];

  return (
    <>
      <style>{`
        .live-title-strong {
          color: #222 !important;
          font-weight: 700;
          font-size: 28px;
          background: none !important;
          -webkit-text-stroke: 0px #222;
        }
      `}</style>
      <div style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{ 
          maxWidth: "600px", 
          margin: "0 auto", 
          background: "#fff", 
          borderRadius: "20px", 
          padding: "30px", 
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
        }}>
          {/* 제목 */}
          <h1 style={{ 
            fontSize: "32px", 
            fontWeight: "bold", 
            color: "#333", 
            marginBottom: "30px",
            textAlign: "center"
          }}>
            🏆 투표 결과
          </h1>
          <AnimatePresence>
            {candidates.map((c, idx) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{
                  background: idx < 3 ? medalColors[idx] : "#fff",
                  borderRadius: 12,
                  marginBottom: 16,
                  padding: 20,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  color: "#222"
                }}
              >
                <div style={{ fontSize: 24, fontWeight: "bold", width: 32, textAlign: "center", color: "#222" }}>
                  {c.rank <= 3 ? (
                    <span>{medalEmojis[c.rank - 1]}</span>
                  ) : (
                    c.rank
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#222" }}>{c.name}</div>
                  <div style={{ fontSize: 14, color: "#888" }}>
                    👍 {c.good || 0} / 👌 {c.soso || 0} / 👎 {c.bad || 0} / 🚫 {c.never || 0}
                  </div>
                </div>
                <div style={{ fontSize: 16, color: "#994d52", fontWeight: 700 }}>점수: {c.score}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          {/* 하단 홈으로 가기 버튼 */}
          <div style={{ marginTop: "30px", textAlign: "center", display: "flex", gap: "15px", justifyContent: "center" }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{ 
                background: "#dc3545", 
                color: "#fff", 
                border: "none", 
                borderRadius: "25px", 
                padding: "12px 24px", 
                fontSize: "16px", 
                fontWeight: "bold", 
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = "#c82333";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = "#dc3545";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              홈으로 가기
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 