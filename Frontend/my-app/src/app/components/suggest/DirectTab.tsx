"use client";
import React, { useState, useEffect, useRef } from "react";
import KakaoMap from '../../components/KakaoMap';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  address?: string;
  phone?: string;
}

interface DirectTabProps {
  groupData: any;
  groupId: string;
  onAddCandidate: (restaurant: Restaurant) => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function DirectTab({ groupData, groupId, onAddCandidate }: DirectTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const mapRef = useRef<any>(null);
  const psRef = useRef<any>(null);

  // 지도가 준비되면 인스턴스 저장
  const handleMapReady = (mapInstance: any) => {
    mapRef.current = mapInstance;
  };

  // 그룹 위치로 이동하는 핀 버튼 클릭 핸들러
  const handleGroupPinClick = () => {
    if (mapRef.current && typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
      const moveLatLng = new window.kakao.maps.LatLng(groupData.x, groupData.y);
      mapRef.current.setCenter(moveLatLng);
    }
  };

  // 카카오맵 초기화
  useEffect(() => {
    const initKakaoServices = () => {
      if (typeof window !== 'undefined' && window.kakao && window.kakao.maps && window.kakao.maps.services) {
        try {
          // Places 서비스 초기화
          if (!psRef.current) {
            psRef.current = new window.kakao.maps.services.Places();
            console.log('카카오맵 Places 서비스 초기화 성공');
            
            // Places 서비스가 준비되면 자동 "맛집" 검색 실행
            if (groupData && typeof groupData.x === 'number' && typeof groupData.y === 'number' && typeof groupData.radius === 'number' && groupData.radius > 0) {
              const options: any = {
                location: new window.kakao.maps.LatLng(groupData.x, groupData.y),
                radius: groupData.radius,
                category_group_code: 'FD6'
              };
              setLoading(true);
              setShowSearchResults(true);
              psRef.current.keywordSearch('맛집', (data: any, status: any) => {
                setLoading(false);
                if (status === window.kakao.maps.services.Status.OK) {
                  const restaurantData = data.map((place: any, index: number) => ({
                    id: `search_${index}`,
                    name: place.place_name,
                    description: place.category_name ? place.category_name.split('>').pop() : '',
                    image: '',
                    category: getCategoryFromName(place.place_name, place.category_name),
                    address: place.road_address_name || place.address_name,
                    phone: place.phone
                  }));
                  setSearchResults(restaurantData);
                  console.log(`[자동 맛집 검색] x: ${groupData.x}, y: ${groupData.y}, radius: ${groupData.radius}m, keyword: "맛집"`);
                } else {
                  setSearchResults([]);
                }
              }, options);
            }
          }
        } catch (error) {
          console.error('Places 서비스 초기화 실패:', error);
        }
      }
    };

    // 더 긴 간격으로 여러 번 시도
    const checkAndInit = () => {
      if (typeof window !== 'undefined' && window.kakao && window.kakao.maps && window.kakao.maps.services) {
        initKakaoServices();
        return true;
      }
      return false;
    };

    // 즉시 시도
    if (!checkAndInit()) {
      // 500ms 간격으로 최대 10번 시도
      let attempts = 0;
      const maxAttempts = 10;
      const interval = setInterval(() => {
        attempts++;
        if (checkAndInit() || attempts >= maxAttempts) {
          clearInterval(interval);
          if (attempts >= maxAttempts) {
            console.error('카카오맵 서비스 초기화 실패: 최대 시도 횟수 초과');
          }
        }
      }, 500);
    }
  }, [groupData]);

  // 검색 실행
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      alert('검색어를 입력해주세요!');
      return;
    }

    // Places 서비스가 없으면 다시 초기화 시도
    if (!psRef.current) {
      if (typeof window !== 'undefined' && window.kakao && window.kakao.maps && window.kakao.maps.services) {
        try {
          psRef.current = new window.kakao.maps.services.Places();
          console.log('검색 시도 중 Places 서비스 재초기화 성공');
        } catch (error) {
          console.error('Places 서비스 재초기화 실패:', error);
          alert('카카오맵 서비스 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
          return;
        }
      } else {
        console.error('카카오맵 API가 로드되지 않았습니다.');
        alert('카카오맵 API가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        return;
      }
    }

    setLoading(true);
    setShowSearchResults(true);

    // 검색 옵션: 현재 지도 중심 좌표로만 검색, radius는 지정하지 않음
    let searchOptions: any = { category_group_code: 'FD6' };
    if (mapRef.current && typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
      const center = mapRef.current.getCenter();
      searchOptions.location = center;
      console.log(`[카카오맵 검색] 현재 지도 중심 x: ${center.getLat()}, y: ${center.getLng()}, keyword: "${searchTerm}"`);
    } else {
      console.log(`[카카오맵 검색] 지도 인스턴스 없음, keyword: "${searchTerm}"`);
    }

    psRef.current.keywordSearch(searchTerm, (data: any, status: any) => {
      setLoading(false);
      if (status === window.kakao.maps.services.Status.OK) {
        const restaurantData = data.map((place: any, index: number) => ({
          id: `search_${index}`,
          name: place.place_name,
          description: place.category_name ? place.category_name.split('>').pop() : '',
          image: '',
          category: getCategoryFromName(place.place_name, place.category_name),
          address: place.road_address_name || place.address_name,
          phone: place.phone
        }));
        setSearchResults(restaurantData);
        console.log(`[카카오맵 검색 결과] ${restaurantData.length}개 음식점 발견`);
      } else {
        setSearchResults([]);
      }
    }, searchOptions);
  };

  // 검색어 입력 시 엔터키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };



  // 카테고리 분류
  const getCategoryFromName = (name: string, category: string) => {
    const lowerName = name.toLowerCase();
    const lowerCategory = category ? category.toLowerCase() : '';
    
    if (lowerName.includes('치킨') || lowerCategory.includes('치킨')) return 'chicken';
    if (lowerName.includes('피자') || lowerCategory.includes('피자')) return 'pizza';
    if (lowerName.includes('중국') || lowerName.includes('마라') || lowerCategory.includes('중식')) return 'chinese';
    if (lowerName.includes('맥도날드') || lowerName.includes('버거킹') || lowerName.includes('롯데리아')) return 'franchise';
    return 'korean';
  };

  // 후보 추가 함수 (+버튼 클릭 시)
  const handleAddCandidate = async (restaurant: any) => {
    const added_by = typeof window !== 'undefined' ? (sessionStorage.getItem('participant_id') || 'unknown') : 'unknown';
    const body = {
      added_by,
      kakao_data: restaurant
    };
    try {
      const res = await fetch(`http://localhost:8000/groups/${groupId}/candidates/kakao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert(`${restaurant.place_name || restaurant.name}이(가) 후보에 추가되었습니다!`);
      } else {
        alert('후보 추가에 실패했습니다.');
      }
    } catch (e) {
      alert('후보 추가 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      {/* 지도 표시 */}
      {groupData && (
        <div style={{ 
          marginBottom: "20px",
          height: "300px",
          borderRadius: "12px",
          overflow: "hidden",
          position: "relative"
        }}>
          <KakaoMap
            searchKeyword=""
            onLocationChange={() => {}}
            centerLat={groupData.x}
            centerLng={groupData.y}
            onMapReady={handleMapReady}
            pinButtonType="group"
            onPinClick={handleGroupPinClick}
          />
        </div>
      )}

      {/* 검색바 */}
      <div style={{ 
        marginBottom: "20px",
        position: "relative"
      }}>
        <div style={{
          display: "flex",
          gap: "10px"
        }}>
          <input
            type="text"
            placeholder="음식점 검색 (예: 이태원 맛집)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ 
              flex: 1,
              padding: "12px 40px 12px 15px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "16px",
              outline: "none",
              color: "#222",
              background: "#fff" // 흰 배경
            }}
          />
          <style>{`
            input::placeholder {
              color: #aaa;
              opacity: 1;
            }
          `}</style>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ 
              padding: "12px 20px",
              background: "#994d52",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "검색중..." : "검색"}
          </button>
        </div>
        {searchTerm && !loading && (
          <button
            onClick={() => {
              setSearchTerm('');
              setShowSearchResults(false);
              setSearchResults([]);
            }}
            style={{ 
              position: "absolute",
              right: "120px",
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

      {/* 검색 결과 목록 */}
      {showSearchResults && (
        <div style={{ 
          marginBottom: "20px",
          maxHeight: "400px",
          overflowY: "auto"
        }}>
          <h3 style={{ 
            fontSize: "18px", 
            fontWeight: "bold", 
            color: "#333", 
            marginBottom: "15px"
          }}>
            검색 결과
          </h3>
          
          {loading ? (
            <div style={{ textAlign: "center", color: "#999", fontSize: "16px", padding: "40px 0" }}>
              검색 중...
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", fontSize: "16px", padding: "40px 0" }}>
              검색 결과가 없습니다
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {searchResults.map((restaurant) => (
                <div key={restaurant.id} style={{ 
                  display: "flex",
                  alignItems: "center",
                  padding: "15px",
                  background: "#f8f9fa",
                  borderRadius: "12px",
                  gap: "15px"
                }}>

                  
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
                    {restaurant.address && (
                      <div style={{ 
                        fontSize: "12px", 
                        color: "#999",
                        marginBottom: "2px"
                      }}>
                        📍 {restaurant.address}
                      </div>
                    )}
                    {restaurant.phone && (
                      <div style={{ 
                        fontSize: "12px", 
                        color: "#999",
                        marginBottom: "4px"
                      }}>
                        📞 {restaurant.phone}
                      </div>
                    )}

                  </div>
                  
                  {/* 추가 버튼 */}
                  <button
                    onClick={() => handleAddCandidate(restaurant)}
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
      )}

      {/* 기존 식당 목록 (검색 결과가 없을 때만 표시) */}
      {!showSearchResults && (
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
          
          <div style={{ textAlign: "center", color: "#999", fontSize: "16px", padding: "40px 0" }}>
            검색어를 입력하여 음식점을 찾아보세요
          </div>
        </div>
      )}
    </div>
  );
} 