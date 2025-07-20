import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// 파이어베이스 import 필요 (firebaseApp, database 등)
import { ref, onValue, off } from "firebase/database";
import { database } from "../../../firebase";

interface SuggestCompleteWaitScreenProps {
  groupId: string;
  participantId: string | null;
  router: any;
  timeLeft: string;
}

interface Participant {
  nickname: string;
  suggest_complete: boolean;
}

const SuggestCompleteWaitScreen: React.FC<SuggestCompleteWaitScreenProps> = ({ groupId, router, timeLeft }) => {
  const [participants, setParticipants] = useState<{ [id: string]: Participant }>({});
  const [allComplete, setAllComplete] = useState(false);

  useEffect(() => {
    // 파이어베이스 realtimeDB에서 참가자 목록 구독
    const participantsRef = ref(database, `groups/${groupId}/participants`);
    const unsubscribe = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setParticipants(data);
      const allDone = Object.values(data).length > 0 && Object.values(data).every((p: any) => p.suggest_complete);
      setAllComplete(allDone);
      if (allDone) router.push(`/tinder?group_id=${groupId}`);
    });
    return () => off(participantsRef, "value", unsubscribe);
  }, [groupId, router]);

  useEffect(() => {
    // 타이머가 끝나면 자동으로 투표 화면으로 이동
    if (timeLeft === "투표 종료") {
      setTimeout(() => {
        router.push(`/tinder?group_id=${groupId}`);
      }, 1000);
    }
  }, [timeLeft, groupId, router]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "400px",
        width: "100%",
        background: "#fff",
        borderRadius: "20px",
        padding: "40px 30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        textAlign: "center"
      }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#333", marginBottom: "20px" }}>
          제안 완료 대기 중
        </h2>
        <div style={{ fontSize: "16px", color: "#666", marginBottom: "20px" }}>
          모든 참가자가 제안을 완료하면 투표가 시작됩니다.<br />
          남은 시간: <span style={{ color: timeLeft === "투표 종료" ? "#dc3545" : "#333", fontWeight: "bold" }}>{timeLeft}</span>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", color: "#333", marginBottom: "10px" }}>참가자 현황</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {Object.values(participants).length === 0 ? (
              <div style={{ color: "#aaa" }}>참가자 정보를 불러오는 중...</div>
            ) : (
              Object.values(participants).map((p, idx) => (
                <div key={idx} style={{
                  color: p.suggest_complete ? "#28a745" : "#999",
                  fontWeight: p.suggest_complete ? "bold" : undefined,
                  fontSize: "16px"
                }}>
                  {p.nickname} {p.suggest_complete ? "✔" : "(제안 중...)"}
                </div>
              ))
            )}
          </div>
        </div>
        <div style={{ fontSize: "15px", color: allComplete ? "#28a745" : "#666", fontWeight: allComplete ? "bold" : undefined }}>
          {allComplete ? "모든 참가자가 제안을 완료했습니다! 곧 투표가 시작됩니다." : "다른 참가자들이 제안을 완료할 때까지 기다려주세요."}
        </div>
      </div>
    </div>
  );
};

export default SuggestCompleteWaitScreen; 