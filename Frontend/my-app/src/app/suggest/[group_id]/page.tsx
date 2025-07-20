"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import KakaoMap from '../../components/KakaoMap';

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
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
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

  // 게이지 퍼센트 계산 (participate 페이지와 동일)
  const getProgressPercentage = () => {
    if (!groupData?.start_votingtime || !groupData?.group_creation_time) {
      return 100;
    }
    
    const now = new Date().getTime();
    const creationTime = new Date(groupData.group_creation_time).getTime();
    
    // start_votingtime은 분 단위 정수이므로, 그룹 생성 시점에서 해당 분 수만큼 후가 투표 시작 시간
    const votingDurationMinutes = groupData.start_votingtime;
    const votingTime = creationTime + (votingDurationMinutes * 60 * 1000);
    
    // 전체 기간 (그룹 생성부터 투표 시작까지)
    const totalDuration = votingTime - creationTime;
    
    // 남은 시간
    const remainingTime = votingTime - now;
    
    if (remainingTime <= 0) return 0;
    
    // 남은 퍼센트 계산
    const remainingPercentage = (remainingTime / totalDuration) * 100;
    
    return Math.max(0, Math.min(100, remainingPercentage));
  };

  // 카테고리 목록
  const categories = [
    { id: 'all', name: '전체' },
    { id: 'franchise', name: '프랜차이즈' },
    { id: 'chicken', name: '치킨' },
    { id: 'pizza', name: '피자/양식' },
    { id: 'chinese', name: '중국집' },
    { id: 'korean', name: '한식' }
  ];

  // 그룹 데이터 가져오기
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/groups/${groupId}`);
        if (response.ok) {
          const data = await response.json();
          setGroupData(data);
          // 그룹 데이터를 가져온 후 식당 정보도 가져오기
          fetchRestaurants(data);
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

  // 식당 정보 가져오기
  const fetchRestaurants = async (groupData: any) => {
    setLoading(true);
    console.log('그룹 데이터:', groupData);
    console.log('현재 탭:', activeTab);
    console.log('현재 카테고리:', activeCategory);
    
    try {
      let restaurantData: Restaurant[] = [];

      if (activeTab === 'direct') {
        // 카카오맵 API 사용 - 그룹 생성 시 입력한 위치와 반경 정보 사용
        // delivery가 true면 delivery_time을 사용, offline이 true면 radius를 사용
        let searchRadius = 20000; // 기본값
        
        if (groupData.delivery && groupData.delivery_time) {
          // 배달 시간을 반경으로 변환 (대략적인 계산)
          searchRadius = groupData.delivery_time * 1000; // 1분당 1km
        } else if (groupData.offline && groupData.radius) {
          // 도보 거리를 미터 단위로 사용
          searchRadius = groupData.radius;
        }
        
        const kakaoResponse = await fetch(
          `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&radius=${searchRadius}&x=${groupData.y}&y=${groupData.x}`,
          {
            headers: {
              'Authorization': 'KakaoAK YOUR_KAKAO_API_KEY' // 실제 API 키로 교체 필요
            }
          }
        );
        
        if (kakaoResponse.ok) {
          const kakaoData = await kakaoResponse.json();
          restaurantData = kakaoData.documents.map((doc: any, index: number) => ({
            id: `kakao_${index}`,
            name: doc.place_name,
            description: doc.category_name.split('>').pop() || '',
            rating: 4.6, // 카카오맵 API에는 평점이 없으므로 기본값
            image: getFoodImage(doc.place_name, doc.category_name),
            category: getCategoryFromName(doc.place_name, doc.category_name)
          }));
        }
      } else {
        // 요기요 API 사용 - 그룹 생성 시 입력한 위치 정보 사용
        // 카테고리를 요기요 API 형식으로 변환
        const getYogiyoCategory = (category: string) => {
          const categoryMap: { [key: string]: string } = {
            'all': '',
            'franchise': '프랜차이즈',
            'chicken': '치킨',
            'pizza': '피자',
            'chinese': '중식',
            'korean': '한식'
          };
          return categoryMap[category] || '';
        };

        const yogiyoResponse = await fetch(
          `https://www.yogiyo.co.kr/api/v2/restaurants?items=60&lat=${groupData.x}&lng=${groupData.y}&order=rank&page=0&search=&serving_type=vd&category=${encodeURIComponent(getYogiyoCategory(activeCategory))}`,
          {
            headers: {
              'Authorization': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTI4Mzc3OTUsImV4cCI6MTc1Mjg0NDk5NSwicGxhdGZvcm0iOiJZR1kiLCJyb2xlIjoidXNlciIsInN1Yl9pZCI6IjkwMjIxNTQyOSIsImJhc2VfdXJsIjoiaHR0cHM6Ly93d3cueW9naXlvLmNvLmtyIn0.nQzYafM-w33dP5Pc8uRQsbk3CQwQmM4zxuHPRYIF2JSnihhl7PwChpcc7KZuM6y9MRgelIjg3OPjSGFpPrwdMi4AzYA5EYph0mLn0rpWi6T_fLTRsRnso3IUc5EGZSNHoC1UXPopBUEMQi7tNLrDbaxRFtcAc-Q5L3GPP0M3438Xick7DZ648JPtk2nAYKNp-uGhLoYG1VFZw3sIl7dgSyoZhzyvD6pmOhNc1GzhXRFtUdTv8WqAr3aKjmjWq6xpzrzmXu7AHkaMifi1N-lm0-Wi25M6XRukWUI4YIgPd7RmyAadRQh7sJm9pQYxPMVnhfdgthxSmTLsSkomn2izqg'
            }
          }
        );
        
        if (yogiyoResponse.ok) {
          const yogiyoData = await yogiyoResponse.json();
          restaurantData = yogiyoData.restaurants.map((restaurant: any, index: number) => ({
            id: `yogiyo_${restaurant.id}`,
            name: restaurant.name,
            description: restaurant.menu_summary || '',
            rating: restaurant.rating || 4.6,
            image: restaurant.logo_url || getFoodImage(restaurant.name, ''),
            category: getCategoryFromName(restaurant.name, restaurant.category)
          }));
        }
      }

      // 임시 데이터 (API 호출 실패 시) 제거
      // if (restaurantData.length === 0) {
      //   restaurantData = [
      //     {
      //       id: 'temp_1',
      //       name: '쿵푸마라탕',
      //       description: '마라탕',
      //       rating: 4.6,
      //       image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      //       category: 'chinese'
      //     },
      //     {
      //       id: 'temp_2',
      //       name: '도미노피자',
      //       description: '베이컨피자, 하와이안피자...',
      //       rating: 4.6,
      //       image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      //       category: 'pizza'
      //     },
      //     {
      //       id: 'temp_3',
      //       name: '바로덮밥',
      //       description: '김치덮밥, 우삼겹덮밥...',
      //       rating: 4.6,
      //       image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      //       category: 'korean'
      //     },
      //     {
      //       id: 'temp_4',
      //       name: '맥도날드',
      //       description: '빅맥, 상하이버거, 1955버거',
      //       rating: 4.6,
      //       image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      //       category: 'franchise'
      //     }
      //   ];
      // }

      setRestaurants(restaurantData);
    } catch (error) {
      console.error("식당 정보 가져오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 시 식당 정보 다시 가져오기
  useEffect(() => {
    if (groupData) {
      fetchRestaurants(groupData);
    }
  }, [activeTab, activeCategory, groupData]);

  // 카테고리별 필터링
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesCategory = activeCategory === 'all' || restaurant.category === activeCategory;
    const matchesSearch = searchTerm === '' || 
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 음식 이미지 매핑
  const getFoodImage = (name: string, category: string) => {
    const imageMap: { [key: string]: string } = {
      '치킨': 'https://images.unsplash.com/photo-1567620832904-9feaa4f70e0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      '피자': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      '마라탕': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      '덮밥': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      '햄버거': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    };
    
    for (const [key, url] of Object.entries(imageMap)) {
      if (name.includes(key) || category.includes(key)) {
        return url;
      }
    }
    return imageMap['햄버거']; // 기본값
  };

  // 카테고리 분류
  const getCategoryFromName = (name: string, category: string) => {
    const lowerName = name.toLowerCase();
    const lowerCategory = category.toLowerCase();
    
    if (lowerName.includes('치킨') || lowerCategory.includes('치킨')) return 'chicken';
    if (lowerName.includes('피자') || lowerCategory.includes('피자')) return 'pizza';
    if (lowerName.includes('중국') || lowerName.includes('마라') || lowerCategory.includes('중식')) return 'chinese';
    if (lowerName.includes('맥도날드') || lowerName.includes('버거킹') || lowerName.includes('롯데리아')) return 'franchise';
    return 'korean';
  };

  // 후보 추가
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

  if (loading) {
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
          <div style={{ color: "#333", fontSize: "18px" }}>식당 정보를 불러오는 중...</div>
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

          {/* 카테고리 탭 */}
          <div style={{ 
            display: "flex", 
            overflowX: "auto",
            gap: "20px",
            paddingBottom: "10px"
          }}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                style={{ 
                  padding: "8px 0",
                  background: "none",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: activeCategory === category.id ? "#333" : "#999",
                  borderBottom: activeCategory === category.id ? "2px solid #994d52" : "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 직접가기 탭일 때 지도 표시 */}
        {activeTab === 'direct' && groupData && (
          <div style={{ 
            marginBottom: "20px",
            height: "300px",
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            <KakaoMap
              searchKeyword=""
              onLocationChange={() => {}}
              centerLat={groupData.x}
              centerLng={groupData.y}
            />
          </div>
        )}

        {/* 검색바 */}
        <div style={{ 
          marginBottom: "20px",
          position: "relative"
        }}>
          <input
            type="text"
            placeholder="검색어"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: "100%",
              padding: "12px 40px 12px 15px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "16px",
              outline: "none"
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ 
                position: "absolute",
                right: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                fontSize: "18px",
                color: "#999",
                cursor: "pointer"
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 식당 목록 */}
        <div style={{ 
          height: activeTab === 'direct' ? "calc(100vh - 800px)" : "calc(100vh - 500px)",
          minHeight: "200px",
          maxHeight: activeTab === 'direct' ? "calc(100vh - 800px)" : "50vh",
          overflowY: "auto"
        }}>
          <h3 style={{ 
            fontSize: "18px", 
            fontWeight: "bold", 
            color: "#333", 
            marginBottom: "15px"
          }}>
            음식점 목록
          </h3>
          
          {filteredRestaurants.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", fontSize: "16px", padding: "40px 0" }}>
              식당이 없습니다
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {filteredRestaurants.map((restaurant) => (
                <div key={restaurant.id} style={{ 
                  display: "flex",
                  alignItems: "center",
                  padding: "15px",
                  background: "#f8f9fa",
                  borderRadius: "12px",
                  gap: "15px"
                }}>
                  {/* 이미지 */}
                  <div style={{ 
                    width: "60px", 
                    height: "60px", 
                    borderRadius: "8px",
                    overflow: "hidden",
                    flexShrink: 0
                  }}>
                    <img 
                      src={restaurant.image}
                      alt={restaurant.name}
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover"
                      }}
                    />
                  </div>
                  
                  {/* 정보 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: "16px", 
                      fontWeight: "bold", 
                      color: "#333",
                      marginBottom: "4px"
                    }}>
                      {restaurant.name}
                    </div>
                    <div style={{ 
                      fontSize: "14px", 
                      color: "#666",
                      marginBottom: "4px"
                    }}>
                      {restaurant.description}
                    </div>
                    <div style={{ 
                      fontSize: "14px", 
                      color: "#666",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      ⭐ {restaurant.rating}
                    </div>
                  </div>
                  
                  {/* 추가 버튼 */}
                  <button
                    onClick={() => addCandidate(restaurant)}
                    style={{ 
                      width: "40px",
                      height: "40px",
                      background: "#994d52",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      fontSize: "20px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#8a4449";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#994d52";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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