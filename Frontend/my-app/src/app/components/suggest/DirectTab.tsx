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
  const [page, setPage] = useState(1);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const mapRef = useRef<any>(null);
  const psRef = useRef<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(15);

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
                  setSearchResults(data); // place 원본 객체 그대로 저장
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

  // 검색 실행 (페이지네이션 적용)
  const handleSearch = (resetPage = true) => {
    let keyword = searchTerm.trim();
    const nextPage = resetPage ? 1 : page + 1;
    let searchOptions: any = { category_group_code: 'FD6', size: 15, page: nextPage };

    if (!keyword) {
      // 검색어가 없으면 자동 검색(맛집, groupData 위치/반경)
      keyword = "맛집";
      if (groupData && groupData.x && groupData.y && groupData.radius) {
        searchOptions.location = new window.kakao.maps.LatLng(groupData.x, groupData.y);
        searchOptions.radius = groupData.radius;
        console.log(`[자동 더보기] x: ${groupData.x}, y: ${groupData.y}, radius: ${groupData.radius}m, keyword: "맛집", page: ${nextPage}`);
      }
    } else {
      // 검색어가 있으면 기존대로 지도 중심 기준
      if (mapRef.current && typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
        const center = mapRef.current.getCenter();
        searchOptions.location = center;
        console.log(`[카카오맵 검색] 현재 지도 중심 x: ${center.getLat()}, y: ${center.getLng()}, keyword: "${keyword}", page: ${nextPage}`);
      } else {
        console.log(`[카카오맵 검색] 지도 인스턴스 없음, keyword: "${keyword}", page: ${nextPage}`);
      }
    }

    setLoading(true);
    setShowSearchResults(true);
    psRef.current.keywordSearch(keyword, (data: any, status: any) => {
      setLoading(false);
      if (status === window.kakao.maps.services.Status.OK) {
        if (resetPage) {
          setSearchResults(data);
          setPage(1);
        } else {
          setSearchResults(prev => {
            const existingIds = new Set(prev.map((item: any) => item.id || item.kakao_id));
            const newData = data.filter((item: any) => !existingIds.has(item.id || item.kakao_id));
            return [...prev, ...newData];
          });
          setPage(nextPage);
        }
      } else {
        if (resetPage) setSearchResults([]);
      }
    }, searchOptions);
  };

  // 검색어 입력 시 엔터키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(true);
    }
  };

  // 더보기 버튼 클릭 핸들러
  const handleLoadMore = () => {
    handleSearch(false);
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

  const handleInfoClick = (restaurant: any) => {
    const kakao_id = restaurant.id || restaurant.kakao_id;
    if (kakao_id) {
      setModalUrl(`https://place.map.kakao.com/${kakao_id}`);
      setModalOpen(true);
    }
  };

  const handleCardClick = (id: string, restaurant: any) => {
    setSelectedId(selectedId === id ? null : id);
    // 활성화 시 지도 이동
    if (selectedId !== id && mapRef.current && typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
      const x = Number(restaurant.y);
      const y = Number(restaurant.x);
      if (!isNaN(x) && !isNaN(y)) {
        const moveLatLng = new window.kakao.maps.LatLng(x, y);
        mapRef.current.setCenter(moveLatLng);
      }
    }
  };

  const visibleResults = searchResults;
  console.log("searchResults.length:", searchResults.length, "visibleCount:", visibleCount);

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
              {visibleResults.map((restaurant) => {
                const cardId = restaurant.id || restaurant.kakao_id;
                return (
                  <div
                    key={cardId}
                    onClick={() => handleCardClick(cardId, restaurant)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "15px",
                      background: "#f8f9fa",
                      borderRadius: "12px",
                      gap: "15px",
                      border: selectedId === cardId ? "2px solid #994d52" : "2px solid transparent",
                      cursor: "pointer"
                    }}
                  >
                    {/* 정보 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: "16px", 
                        fontWeight: "bold", 
                        color: "#333",
                        marginBottom: "4px"
                      }}>
                        {restaurant.place_name || restaurant.name}
                      </div>
                      <div style={{ 
                        fontSize: "14px", 
                        color: "#666",
                        marginBottom: "4px"
                      }}>
                        {restaurant.category_name ? restaurant.category_name.split('>').pop() : ''}
                      </div>
                      {restaurant.road_address_name && (
                        <div style={{ 
                          fontSize: "12px", 
                          color: "#999",
                          marginBottom: "2px"
                        }}>
                          📍 {restaurant.road_address_name}
                        </div>
                      )}
                      {restaurant.address_name && (
                        <div style={{ 
                          fontSize: "12px", 
                          color: "#999",
                          marginBottom: "2px"
                        }}>
                          📍 {restaurant.address_name}
                        </div>
                      )}
                    </div>
                    {/* 버튼 영역: i버튼 + +버튼 */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: 12 }}>
                      <button
                        onClick={e => { e.stopPropagation(); handleInfoClick(restaurant); }}
                        style={{
                          background: "#eee",
                          border: "none",
                          borderRadius: "50%",
                          width: 32,
                          height: 32,
                          fontSize: 20,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: restaurant.id || restaurant.kakao_id ? "pointer" : "not-allowed"
                        }}
                        title="카카오 플레이스 정보"
                        disabled={!(restaurant.id || restaurant.kakao_id)}
                      >
                        ℹ️
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleAddCandidate(restaurant); }}
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
                  </div>
                );
              })}
              {searchResults.length > 0 && searchResults.length % 15 === 0 && (
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); handleLoadMore(); }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "10px",
                    background: "#994d52",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                  disabled={loading}
                >
                  {loading ? "로딩 중..." : "더보기"}
                </button>
              )}
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
      {/* 모달 */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, width: "90vw", maxWidth: 600, height: "80vh", position: "relative"
            }}
          >
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: "absolute", top: 10, right: 10, background: "none", border: "none", fontSize: 24, cursor: "pointer"
              }}
            >✕</button>
            <iframe
              src={modalUrl}
              style={{ width: "100%", height: "100%", border: "none", borderRadius: 12 }}
              title="카카오 플레이스"
            />
          </div>
        </div>
      )}
    </div>
  );
} 