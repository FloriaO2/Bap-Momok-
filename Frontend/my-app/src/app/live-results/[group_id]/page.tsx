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
        maxWidth: 500, 
        margin: "0 auto", 
        padding: 24,
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "Arial, sans-serif"
      }}>
        <h2 className="live-title-strong" style={{ textAlign: "center", marginBottom: 24 }}>
          실시간 투표 순위
        </h2>
        <AnimatePresence>
          {candidates.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                background: "#fff",
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
              <div style={{ fontSize: 24, fontWeight: "bold", width: 32, textAlign: "center", color: "#222" }}>{c.rank}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#222" }}>{c.name}</div>
                <div style={{ fontSize: 14, color: "#888" }}>
                  👍 {c.good || 0} / 😐 {c.soso || 0} / 👎 {c.bad || 0} / 🚫 {c.never || 0}
                </div>
              </div>
              <div style={{ fontSize: 16, color: "#994d52", fontWeight: 700 }}>점수: {c.score}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
} 