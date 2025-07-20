"use client";
import React, { useState, useEffect } from "react";
import KakaoMap from '../../components/KakaoMap';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  rating: number;
  image: string;
  category: string;
}

interface DirectTabProps {
  groupData: any;
  groupId: string;
  onAddCandidate: (restaurant: Restaurant) => void;
}

export default function DirectTab({ groupData, groupId, onAddCandidate }: DirectTabProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // 카테고리 목록
  const categories = [
    { id: 'all', name: '전체' },
    { id: 'franchise', name: '프랜차이즈' },
    { id: 'chicken', name: '치킨' },
    { id: 'pizza', name: '피자/양식' },
    { id: 'chinese', name: '중국집' },
    { id: 'korean', name: '한식' }
  ];

  // 식당 정보 가져오기 (카카오맵 API)
  const fetchRestaurants = async () => {
    setLoading(true);
    
    try {
      let searchRadius = 20000; // 기본값
      
      if (groupData.offline && groupData.radius) {
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
        const restaurantData = kakaoData.documents.map((doc: any, index: number) => ({
          id: `kakao_${index}`,
          name: doc.place_name,
          description: doc.category_name.split('>').pop() || '',
          rating: 4.6,
          image: getFoodImage(doc.place_name, doc.category_name),
          category: getCategoryFromName(doc.place_name, doc.category_name)
        }));
        setRestaurants(restaurantData);
      }
    } catch (error) {
      console.error("식당 정보 가져오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 변경 시 식당 정보 다시 가져오기
  useEffect(() => {
    if (groupData) {
      fetchRestaurants();
    }
  }, [activeCategory, groupData]);

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

  return (
    <div>
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

      {/* 지도 표시 */}
      {groupData && (
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
        height: "calc(100vh - 800px)",
        minHeight: "200px",
        maxHeight: "50vh",
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
        
        {loading ? (
          <div style={{ textAlign: "center", color: "#999", fontSize: "16px", padding: "40px 0" }}>
            식당 정보를 불러오는 중...
          </div>
        ) : filteredRestaurants.length === 0 ? (
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
                  onClick={() => onAddCandidate(restaurant)}
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
    </div>
  );
} 