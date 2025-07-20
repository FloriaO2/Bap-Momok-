"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function ResultsPage({ params }: { params: Promise<{ group_id: string }> }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.group_id;
  
  const router = useRouter();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`http://localhost:8000/groups/${groupId}/results`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("결과 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [groupId]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ color: "#fff", fontSize: "18px" }}>결과를 불러오는 중...</div>
      </div>
    );
  }

  if (!results) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ color: "#fff", fontSize: "18px" }}>결과를 찾을 수 없습니다.</div>
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

        {/* Top3 섹션 */}
        {results.top3 && results.top3.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ 
              fontSize: "24px", 
              fontWeight: "bold", 
              color: "#333", 
              marginBottom: "20px",
              textAlign: "center"
            }}>
              🥇 Top 3
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {results.top3.map((candidate: any, index: number) => (
                <div key={candidate.id} style={{ 
                  background: index === 0 ? "linear-gradient(135deg, #ffd700, #ffed4e)" : 
                           index === 1 ? "linear-gradient(135deg, #c0c0c0, #e8e8e8)" :
                           "linear-gradient(135deg, #cd7f32, #daa520)",
                  borderRadius: "15px",
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ 
                    fontSize: "24px", 
                    fontWeight: "bold",
                    color: "#333",
                    minWidth: "40px"
                  }}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: "18px", 
                      fontWeight: "bold", 
                      color: "#333",
                      marginBottom: "5px"
                    }}>
                      {candidate.name}
                    </div>
                    <div style={{ 
                      fontSize: "14px", 
                      color: "#666",
                      display: "flex",
                      gap: "15px"
                    }}>
                      <span>👍 {candidate.good}</span>
                      <span>😐 {candidate.soso}</span>
                      <span>👎 {candidate.bad}</span>
                      <span>❌ {candidate.never}</span>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: "20px", 
                    fontWeight: "bold", 
                    color: "#333"
                  }}>
                    {candidate.rank}위
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 전체 결과 */}
        <div>
          <h2 style={{ 
            fontSize: "24px", 
            fontWeight: "bold", 
            color: "#333", 
            marginBottom: "20px",
            textAlign: "center"
          }}>
            📊 전체 순위
          </h2>
          <div style={{ 
            maxHeight: "400px", 
            overflowY: "auto",
            background: "#f8f9fa",
            borderRadius: "15px",
            padding: "20px"
          }}>
            {results.all_results && results.all_results.length > 0 ? (
              results.all_results.map((candidate: any, index: number) => (
                <div key={candidate.id} style={{ 
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: index < results.all_results.length - 1 ? "1px solid #e9ecef" : "none",
                  gap: "15px"
                }}>
                  <div style={{ 
                    fontSize: "18px", 
                    fontWeight: "bold", 
                    color: "#333",
                    minWidth: "50px"
                  }}>
                    {candidate.rank}위
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: "16px", 
                      fontWeight: "bold", 
                      color: "#333",
                      marginBottom: "3px"
                    }}>
                      {candidate.name}
                    </div>
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#666",
                      display: "flex",
                      gap: "10px"
                    }}>
                      <span>👍 {candidate.good}</span>
                      <span>😐 {candidate.soso}</span>
                      <span>👎 {candidate.bad}</span>
                      <span>❌ {candidate.never}</span>
                    </div>
                  </div>
                  {candidate.never > 0 && (
                    <div style={{ 
                      background: "#dc3545", 
                      color: "#fff", 
                      padding: "4px 8px", 
                      borderRadius: "12px", 
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      NEVER
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: "center", 
                color: "#999", 
                fontSize: "16px",
                padding: "40px 0"
              }}>
                아직 투표 결과가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div style={{ marginTop: "30px", textAlign: "center", display: "flex", gap: "15px", justifyContent: "center" }}>
          <button
            onClick={() => router.back()}
            style={{ 
              background: "#6c757d", 
              color: "#fff", 
              border: "none", 
              borderRadius: "25px", 
              padding: "12px 24px", 
              fontSize: "16px", 
              fontWeight: "bold", 
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#5a6268";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#6c757d";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            뒤로가기
          </button>
          <button
            onClick={() => router.push('/?action=create')}
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
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#c82333";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#dc3545";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            새 투표 시작
          </button>
        </div>
      </div>
    </div>
  );
} 