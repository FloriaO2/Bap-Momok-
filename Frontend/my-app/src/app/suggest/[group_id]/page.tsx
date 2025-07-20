"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import DirectTab from '../../components/suggest/DirectTab';
import DeliveryTab from '../../components/suggest/DeliveryTab';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  rating: number;
  image: string;
  category: string;
}

export default function SuggestPage({ params }: { params: Promise<{ group_id: string }> }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.group_id;
  
  const router = useRouter();
  const [groupData, setGroupData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'direct' | 'delivery'>('direct');
  const [timeLeft, setTimeLeft] = useState("");

  // 그룹 데이터에서 선택된 옵션 확인
  const hasDelivery = groupData?.delivery;
  const hasOffline = groupData?.offline;
  
  // 탭 표시 여부 결정
  const showDirectTab = hasOffline;
  const showDeliveryTab = hasDelivery;
  
  // 초기 탭 설정 (그룹 데이터 로드 후)
  useEffect(() => {
    if (groupData) {
      if (hasOffline && !hasDelivery) {
        setActiveTab('direct');
      } else if (hasDelivery && !hasOffline) {
        setActiveTab('delivery');
      } else if (hasDelivery && hasOffline) {
        setActiveTab('direct'); // 둘 다 있으면 기본값
      }
    }
  }, [groupData, hasDelivery, hasOffline]);

  // 게이지 퍼센트 계산
  const getProgressPercentage = () => {
    if (!groupData?.start_votingtime || !groupData?.group_creation_time) {
      return 100;
    }
    
    const now = new Date().getTime();
    const creationTime = new Date(groupData.group_creation_time).getTime();
    
    const votingDurationMinutes = groupData.start_votingtime;
    const votingTime = creationTime + (votingDurationMinutes * 60 * 1000);
    
    const totalDuration = votingTime - creationTime;
    const remainingTime = votingTime - now;
    
    if (remainingTime <= 0) return 0;
    
    const remainingPercentage = (remainingTime / totalDuration) * 100;
    
    return Math.max(0, Math.min(100, remainingPercentage));
  };

  // 그룹 데이터 가져오기
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/groups/${groupId}`);
        if (response.ok) {
          const data = await response.json();
          setGroupData(data);
        }
      } catch (error) {
        console.error("그룹 데이터 가져오기 실패:", error);
      }
    };
    fetchGroupData();
  }, [groupId]);

  // 투표 시간 계산
  useEffect(() => {
    if (groupData?.start_votingtime && groupData?.group_creation_time) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const creationTime = new Date(groupData.group_creation_time).getTime();
        const votingDurationMinutes = groupData.start_votingtime;
        const votingTime = creationTime + (votingDurationMinutes * 60 * 1000);
        const timeDiff = votingTime - now;
        
        if (timeDiff > 0) {
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          
          if (hours > 0) {
            setTimeLeft(`${hours}시간 ${minutes}분`);
          } else if (minutes > 0) {
            setTimeLeft(`${minutes}분 ${seconds}초`);
          } else {
            setTimeLeft(`${seconds}초`);
          }
        } else {
          setTimeLeft("투표 종료");
          // 투표 시간이 끝나면 3초 후 결과 화면으로 이동
          setTimeout(() => {
            router.push(`/results/${groupId}`);
          }, 3000);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [groupData, groupId, router]);

  // 후보 추가 함수
  const addCandidate = async (restaurant: Restaurant) => {
    try {
      const response = await fetch(`http://localhost:8000/groups/${groupId}/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: restaurant.name,
          type: restaurant.category,
          detail: {
            description: restaurant.description,
            rating: restaurant.rating,
            image: restaurant.image
          }
        }),
      });

      if (response.ok) {
        alert(`${restaurant.name}이(가) 후보에 추가되었습니다!`);
      } else {
        alert('후보 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('후보 추가 오류:', error);
      alert('후보 추가 중 오류가 발생했습니다.');
    }
  };

  if (!groupData) {
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
          background: "#fff", 
          borderRadius: "20px", 
          padding: "40px", 
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
        }}>
          <div style={{ color: "#333", fontSize: "18px" }}>그룹 정보를 불러오는 중...</div>
        </div>
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
        {/* 헤더 */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ 
            fontSize: "32px", 
            fontWeight: "bold", 
            color: "#333", 
            marginBottom: "30px",
            textAlign: "center"
          }}>
            투표 후보 선택
          </h1>
          
          {/* 투표 시간 */}
          <div style={{ marginBottom: "30px" }}>
            <div style={{ 
              fontSize: "16px", 
              color: "#666", 
              marginBottom: "10px" 
            }}>
              투표까지 남은시간
            </div>
            <div style={{ 
              fontSize: "20px", 
              fontWeight: "bold", 
              color: timeLeft === "투표 종료" ? "#dc3545" : "#333" 
            }}>
              {timeLeft}
            </div>
            {timeLeft === "투표 종료" && (
              <div style={{ 
                fontSize: "14px", 
                color: "#dc3545", 
                marginTop: "5px" 
              }}>
                결과 화면으로 이동합니다...
              </div>
            )}
            {/* 진행바 */}
            <div style={{ 
              width: "100%", 
              height: "8px", 
              background: "#f0f0f0", 
              borderRadius: "4px", 
              marginTop: "10px",
              overflow: "hidden"
            }}>
              <div style={{ 
                width: `${getProgressPercentage()}%`, 
                height: "100%", 
                background: timeLeft === "투표 종료" 
                  ? "linear-gradient(90deg, #dc3545, #c82333)" 
                  : "linear-gradient(90deg, #667eea, #764ba2)", 
                borderRadius: "4px",
                transition: "width 0.3s ease"
              }}></div>
            </div>
          </div>

          {/* 메인 탭 - 둘 다 선택된 경우에만 표시 */}
          {showDirectTab && showDeliveryTab && (
            <div style={{ 
              display: "flex", 
              borderBottom: "1px solid #e0e0e0",
              marginBottom: "15px"
            }}>
              <button
                onClick={() => setActiveTab('direct')}
                style={{ 
                  flex: 1,
                  padding: "12px",
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: activeTab === 'direct' ? "#333" : "#999",
                  borderBottom: activeTab === 'direct' ? "2px solid #994d52" : "none",
                  cursor: "pointer"
                }}
              >
                직접가기
              </button>
              <button
                onClick={() => setActiveTab('delivery')}
                style={{ 
                  flex: 1,
                  padding: "12px",
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: activeTab === 'delivery' ? "#333" : "#999",
                  borderBottom: activeTab === 'delivery' ? "2px solid #994d52" : "none",
                  cursor: "pointer"
                }}
              >
                배달
              </button>
            </div>
          )}
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'direct' && showDirectTab && (
          <DirectTab 
            groupData={groupData}
            groupId={groupId}
            onAddCandidate={addCandidate}
          />
        )}
        
        {activeTab === 'delivery' && showDeliveryTab && (
          <DeliveryTab 
            groupData={groupData}
            groupId={groupId}
            onAddCandidate={addCandidate}
          />
        )}

        {/* 하단 버튼 */}
        <div style={{ 
          marginTop: "30px",
          display: "flex",
          gap: "15px"
        }}>
          <button
            onClick={() => router.push(`/participate/${groupId}`)}
            style={{ 
              flex: 1,
              background: "#6c757d", 
              color: "#fff", 
              border: "none",
              borderRadius: "25px", 
              padding: "15px 30px", 
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
            참여 화면으로
          </button>
          <button
            onClick={() => router.push(`/tinder?group_id=${groupId}`)}
            style={{ 
              flex: 1,
              background: "#994d52",
              color: "#fff", 
              border: "none",
              borderRadius: "25px", 
              padding: "15px 30px", 
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#8a4449";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#994d52";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            투표하러 가기
          </button>
        </div>
      </div>
    </div>
  );
} 