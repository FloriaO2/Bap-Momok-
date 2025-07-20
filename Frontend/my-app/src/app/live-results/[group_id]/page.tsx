"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function LiveResultsPage({ params }: { params: Promise<{ group_id: string }> }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.group_id;
  
  const router = useRouter();
  const [groupData, setGroupData] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [votingProgress, setVotingProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);

  // 그룹 데이터와 결과 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupResponse, resultsResponse] = await Promise.all([
          fetch(`http://localhost:8000/groups/${groupId}`),
          fetch(`http://localhost:8000/groups/${groupId}/results`)
        ]);
        
        const groupData = await groupResponse.json();
        const resultsData = await resultsResponse.json();
        
        setGroupData(groupData);
        setResults(resultsData);
        
        // 투표 진행률 계산 (vote_complete가 true인 사람 수 / 전체 참여자 수)
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
    
    // 실시간 업데이트를 위한 인터벌
    const interval = setInterval(fetchData, 3000); // 3초마다 업데이트
    
    return () => clearInterval(interval);
  }, [groupId]);

  // 투표 완료율이 75% 이상이면 실시간 결과 페이지 닫기
  useEffect(() => {
    if (votingProgress >= 75) {
      // 3초 후 결과 페이지로 이동
      setTimeout(() => {
        router.push(`/results/${groupId}`);
      }, 3000);
    }
  }, [votingProgress, groupId, router]);

  // 실제 후보 데이터 또는 임시 데이터 사용
  const getCandidates = () => {
    if (results?.top3 && results.top3.length > 0) {
      return results.top3.map((candidate: any, index: number) => ({
        ...candidate,
        image: getFoodImage(candidate.name, candidate.type)
      }));
    }
    
    // 임시 후보 데이터 (실제 데이터가 없을 때)
    return [
      {
        id: "temp_1",
        name: "Tacos",
        type: "Mexican",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        rank: 1,
        good: 8,
        soso: 2,
        bad: 0,
        never: 0
      },
      {
        id: "temp_2", 
        name: "Pizza",
        type: "Italian",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        rank: 2,
        good: 6,
        soso: 3,
        bad: 1,
        never: 0
      },
      {
        id: "temp_3",
        name: "Sushi", 
        type: "Japanese",
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        rank: 3,
        good: 5,
        soso: 4,
        bad: 1,
        never: 0
      }
    ];
  };

  // 음식 이미지 매핑 함수
  const getFoodImage = (name: string, type: string) => {
    const imageMap: { [key: string]: string } = {
      '치킨': 'https://images.unsplash.com/photo-1567620832904-9feaa4f70e0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      '피자': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      '스테이크': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      '초밥': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      '파스타': 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      '햄버거': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      '타코': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      '샐러드': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    };
    
    return imageMap[name] || imageMap['햄버거']; // 기본값
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ color: "#333", fontSize: "18px" }}>결과를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "40px auto",
        background: "#fff",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        minHeight: "500px"
      }}>
        {/* 헤더 */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          paddingBottom: "20px",
          borderBottom: "1px solid #f0f0f0"
        }}>
          <button 
            onClick={() => router.push(`/results/${groupId}`)}
            style={{ 
              background: "none", 
              border: "none", 
              fontSize: "24px", 
              cursor: "pointer",
              color: "#333"
            }}
          >
            ✕
          </button>
          <h1 style={{ 
            flex: 1, 
            textAlign: "center", 
            fontSize: "24px", 
            fontWeight: "bold",
            color: "#333",
            margin: 0
          }}>
            실시간 투표 현황
          </h1>
          <div style={{ width: "24px" }}></div>
        </div>

        {/* 투표 진행률 */}
        <div style={{ padding: "30px 0 20px" }}>
          <h2 style={{ 
            fontSize: "18px", 
            fontWeight: "bold", 
            color: "#333", 
            marginBottom: "15px",
            textAlign: "center"
          }}>
            투표 진행률
          </h2>
          <div style={{ 
            width: "100%", 
            height: "8px", 
            background: "#f0f0f0", 
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{ 
              width: `${votingProgress}%`, 
              height: "100%", 
              background: "linear-gradient(90deg, #667eea, #994d52)",
              borderRadius: "4px",
              transition: "width 0.3s ease"
            }}></div>
          </div>
          <div style={{ 
            fontSize: "14px", 
            color: "#666", 
            marginTop: "8px",
            textAlign: "center"
          }}>
            {Math.round(votingProgress)}% 완료
          </div>
        </div>

        {/* Top 3 */}
        <div style={{ padding: "0 0 20px" }}>
          <h2 style={{ 
            fontSize: "20px", 
            fontWeight: "bold", 
            color: "#333", 
            marginBottom: "20px",
            textAlign: "center"
          }}>
            Top 3
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {getCandidates().map((candidate: any, index: number) => (
              <div key={candidate.id} style={{ 
                display: "flex",
                alignItems: "center",
                padding: "15px",
                background: "#f8f9fa",
                borderRadius: "12px",
                gap: "15px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
              }}>
                {/* 순위 */}
                <div style={{ 
                  fontSize: "24px", 
                  fontWeight: "bold",
                  color: index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : "#cd7f32",
                  minWidth: "40px",
                  textAlign: "center"
                }}>
                  {candidate.rank}
                </div>
                {/* 이미지 */}
                <div style={{ 
                  width: "60px", 
                  height: "60px", 
                  borderRadius: "8px",
                  overflow: "hidden",
                  flexShrink: 0
                }}>
                  <img 
                    src={candidate.image}
                    alt={candidate.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                {/* 정보 */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#333", marginBottom: "4px" }}>{candidate.name}</div>
                  <div style={{ fontSize: "14px", color: "#666", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>👍 {candidate.good}</span>
                    <span>😐 {candidate.soso}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 