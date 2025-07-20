"use client";
import React, { useState, useEffect, useRef } from "react";

interface DeliveryTabProps {
  groupData: any;
  groupId: string;
  onAddCandidate?: (restaurant: any) => void;
  registeredCandidateIds?: number[];
}

interface YogiyoRestaurant {
  id: number;
  name: string;
  categories: string[];
  review_avg: number;
  review_count: number;
  thumbnail_url: string;
  estimated_delivery_time: string;
  is_open: boolean;
}

export default function DeliveryTab({ groupData, groupId, onAddCandidate, registeredCandidateIds = [] }: DeliveryTabProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurants, setRestaurants] = useState<YogiyoRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 카테고리 목록
  const categories = [
    { id: 'all', name: '전체' },
    { id: '프랜차이즈', name: '프랜차이즈' },
    { id: '치킨', name: '치킨' },
    { id: '피자양식', name: '피자/양식' },
    { id: '중식', name: '중국집' },
    { id: '한식', name: '한식' },
    { id: '일식돈까스', name: '일식/돈까스' },
    { id: '족발보쌈', name: '족발/보쌈' },
    { id: '야식', name: '야식' },
    { id: '분식', name: '분식' },
    { id: '카페디저트', name: '카페/디저트' }
  ];

  const allCategoryIds = [
    '프랜차이즈', '치킨', '피자양식', '중식', '한식', '일식돈까스', '족발보쌈', '야식', '분식', '카페디저트'
  ];

  // 카테고리별 page/done 상태 관리
  const initialPageMap = Object.fromEntries(allCategoryIds.map(cat => [cat, 0]));
  const initialDoneMap = Object.fromEntries(allCategoryIds.map(cat => [cat, false]));
  const [categoryPageMap, setCategoryPageMap] = useState<{ [cat: string]: number }>(initialPageMap);
  const [categoryDoneMap, setCategoryDoneMap] = useState<{ [cat: string]: boolean }>(initialDoneMap);

  // 페이지별 식당 불러오기 (기존 fetchPage)
  const fetchPage = async (category: string, pageNum: number) => {
    const res = await fetch(`/groups/${groupId}/yogiyo-restaurants?category=${encodeURIComponent(category)}&page=${pageNum}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.restaurants || [];
  };

  // 더보기(다음 페이지) 불러오기
  const loadMore = async () => {
    setLoading(true);
    if (activeCategory === 'all') {
      // 전체: 아직 done이 아닌 카테고리 중 하나를 골라서 불러오기
      const nextCat = allCategoryIds.find(cat => !categoryDoneMap[cat]);
      if (!nextCat) {
        setHasMore(false);
        setLoading(false);
        return;
      }
      const pageNum = categoryPageMap[nextCat];
      const newRestaurants = await fetchPage(nextCat, pageNum);
      setRestaurants(prev => {
        const all = [...prev, ...newRestaurants];
        return Array.from(new Map(all.map(r => [r.id, r])).values());
      });
      setCategoryPageMap(prev => ({ ...prev, [nextCat]: pageNum + 1 }));
      setCategoryDoneMap(prev => ({ ...prev, [nextCat]: newRestaurants.length < 60 }));
      // 모든 카테고리가 done이면 더보기 숨김
      const allDone = allCategoryIds.every(cat => (cat === nextCat ? newRestaurants.length < 60 : categoryDoneMap[cat]));
      setHasMore(!allDone);
    } else {
      // 단일 카테고리
      const pageNum = page;
      const newRestaurants = await fetchPage(activeCategory, pageNum);
      setRestaurants(prev => {
        const all = [...prev, ...newRestaurants];
        return Array.from(new Map(all.map(r => [r.id, r])).values());
      });
      setPage(prev => prev + 1);
      setHasMore(newRestaurants.length === 60);
    }
    setLoading(false);
  };

  // 카테고리 변경/초기화 시 1페이지만 불러오기
  useEffect(() => {
    setRestaurants([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
    setCategoryPageMap(initialPageMap);
    setCategoryDoneMap(initialDoneMap);
    (async () => {
      if (activeCategory === 'all') {
        // 전체: 모든 카테고리 1페이지씩 불러오기
        let allResults: YogiyoRestaurant[] = [];
        for (const cat of allCategoryIds) {
          const firstPage = await fetchPage(cat, 0);
          allResults = allResults.concat(firstPage);
          setCategoryPageMap(prev => ({ ...prev, [cat]: 1 }));
          setCategoryDoneMap(prev => ({ ...prev, [cat]: firstPage.length < 60 }));
        }
        // id 기준 중복 제거
        const unique = Array.from(new Map(allResults.map(r => [r.id, r])).values());
        setRestaurants(unique);
        setHasMore(true);
      } else {
        const firstPage = await fetchPage(activeCategory, 0);
        setRestaurants(firstPage);
        setHasMore(firstPage.length === 60);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line
  }, [activeCategory, groupData]);

  // 검색 필터
  const filteredRestaurants = restaurants.filter((r: any) => {
    const matchesSearch = searchTerm === '' || r.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // id 기준 중복 제거
  const uniqueRestaurants = Array.from(
    new Map(filteredRestaurants.map(r => [r.id, r])).values()
  );

  // 카테고리 탭 드래그 스크롤 구현
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = x - startX.current;
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const onMouseUp = () => { isDragging.current = false; };

  return (
    <div>
      {/* 카테고리 탭 */}
      <div
        ref={scrollRef}
        className="category-scroll"
        style={{
          display: "flex",
          gap: "20px",
          paddingBottom: "10px",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch"
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseUp}
        onMouseUp={onMouseUp}
      >
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
      {/* 검색바 */}
      <div style={{ marginBottom: "20px", position: "relative" }}>
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
      <div style={{ height: "calc(100vh - 500px)", minHeight: "200px", maxHeight: "50vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#333", marginBottom: "15px" }}>
          배달 음식점 목록
        </h3>
        {loading && restaurants.length === 0 ? (
          <div style={{ textAlign: "center", color: "#999", fontSize: "16px", padding: "40px 0" }}>
            식당 정보를 불러오는 중...
          </div>
        ) : uniqueRestaurants.length === 0 ? (
          <div style={{ textAlign: "center", color: "#999", fontSize: "16px", padding: "40px 0" }}>
            식당이 없습니다
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {uniqueRestaurants.map((r) => (
                <div
                  key={r.id}
                  style={{ display: "flex", alignItems: "center", padding: "15px", background: "#f8f9fa", borderRadius: "12px", gap: "15px" }}
                >
                  {/* 썸네일 */}
                  <div style={{ width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                    <img
                      src={r.thumbnail_url}
                      alt={r.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  {/* 정보 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#333", marginBottom: "4px" }}>{r.name}</div>
                    <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>{r.categories.join(', ')}</div>
                    <div style={{ fontSize: "14px", color: "#666", display: "flex", alignItems: "center", gap: "4px" }}>
                      ⭐ {r.review_avg} ({r.review_count} 리뷰)
                    </div>
                  </div>
                  {/* + 버튼 */}
                  {typeof onAddCandidate === 'function' && (
                    <button
                      onClick={() => onAddCandidate({
                        id: r.id,
                        name: r.name,
                        description: '',
                        rating: r.review_avg,
                        image: r.thumbnail_url,
                        category: r.categories[0] || '',
                        detail: {
                          thumbnail_url: r.thumbnail_url
                        }
                      })}
                      disabled={registeredCandidateIds.includes(r.id)}
                      style={{
                        width: "40px",
                        height: "40px",
                        background: registeredCandidateIds.includes(r.id) ? "#ccc" : "#994d52",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        fontSize: "20px",
                        fontWeight: "bold",
                        cursor: registeredCandidateIds.includes(r.id) ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={e => {
                        if (!registeredCandidateIds.includes(r.id)) {
                          e.currentTarget.style.background = "#8a4449";
                          e.currentTarget.style.transform = "scale(1.1)";
                        }
                      }}
                      onMouseOut={e => {
                        if (!registeredCandidateIds.includes(r.id)) {
                          e.currentTarget.style.background = "#994d52";
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                    >
                      {registeredCandidateIds.includes(r.id) ? '✔' : '+'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {hasMore && activeCategory !== 'all' && (
              <div style={{ textAlign: "center", margin: "20px 0" }}>
                <button onClick={loadMore} disabled={loading} style={{
                  background: "#994d52",
                  color: "#fff",
                  border: "none",
                  borderRadius: "20px",
                  padding: "10px 30px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1
                }}>
                  {loading ? '로딩 중...' : '더보기'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 