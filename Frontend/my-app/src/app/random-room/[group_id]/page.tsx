'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from './random-room.module.css';

// Wheel 컴포넌트를 클라이언트 사이드에서만 로드
const Wheel = dynamic(() => import('react-custom-roulette').then(mod => ({ default: mod.Wheel })), {
  ssr: false,
  loading: () => <div>로딩 중...</div>
});

declare global {
  interface Window {
    kakao: any;
  }
}

interface Restaurant {
  id: string;
  name: string;
  rating: number;
  address: string;
  category: string;
  type: 'kakao' | 'yogiyo';
  detail?: any;
}

interface GroupData {
  delivery: boolean;
  delivery_time: number;
  offline: boolean;
  visit_time: number;
  radius: number;
  x: number;
  y: number;
  state: string;
}

export default function RandomRoomPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.group_id as string;
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ type: string, url: string, label: string } | null>(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuList, setMenuList] = useState<{name: string, image: string|null}[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string|null>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        console.log('그룹 데이터 가져오기 시작:', groupId);
        console.log('BACKEND_URL:', BACKEND_URL);
        
        const response = await fetch(`${BACKEND_URL}/groups/${groupId}`);
        console.log('응답 상태:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('받은 데이터:', data);
          if (data && data.x && data.y) {
            setGroupData(data);
          } else {
            setError('그룹 정보를 가져올 수 없습니다.');
          }
        } else {
          setError('그룹 정보를 가져올 수 없습니다.');
        }
      } catch (err) {
        console.error('그룹 데이터 가져오기 오류:', err);
        setError('그룹 정보를 가져올 수 없습니다.');
      }
    };

    fetchGroupData();
  }, [groupId]);

  // 카테고리 정규화 함수
  const normalizeCategory = (category: string): string => {
    let normalized = category.split('>')[0].trim();
    
    // 카테고리 정규화
    if (normalized.includes('치킨') || normalized.includes('닭')) {
      return '치킨';
    } else if (normalized.includes('피자')) {
      return '피자';
    } else if (normalized.includes('햄버거') || normalized.includes('버거')) {
      return '햄버거';
    } else if (normalized.includes('중식') || normalized.includes('중국')) {
      return '중식';
    } else if (normalized.includes('일식') || normalized.includes('일본')) {
      return '일식';
    } else if (normalized.includes('양식') || normalized.includes('서양')) {
      return '양식';
    } else if (normalized.includes('한식') || normalized.includes('한국')) {
      return '한식';
    } else if (normalized.includes('카페') || normalized.includes('커피')) {
      return '카페';
    } else if (normalized.includes('분식')) {
      return '분식';
    } else if (normalized.includes('도시락')) {
      return '도시락';
    }
    
    return normalized;
  };

  // 카카오맵 스크립트 로드 확인 (클라이언트 사이드에서만)
  const waitForKakaoMap = (): Promise<void> => {
    return new Promise((resolve) => {
      // 서버 사이드에서는 바로 resolve
      if (typeof window === 'undefined') {
        resolve();
        return;
      }
      
      // 클라이언트 사이드에서만 실행
      const checkKakao = () => {
        if (typeof window !== 'undefined' && window.kakao && window.kakao.maps && window.kakao.maps.services) {
          resolve();
        } else {
          setTimeout(checkKakao, 100);
        }
      };
      checkKakao();
    });
  };

  useEffect(() => {
    if (!groupData) return;

    const fetchRestaurants = async () => {
      setIsLoading(true);
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        const allRestaurants: Restaurant[] = [];

        // 1. 직접가기 설정된 경우 카카오맵 API 호출
        if (groupData.offline && typeof window !== 'undefined') {
          try {
            // 카카오맵 스크립트 로드 대기
            await waitForKakaoMap();
            
            // 카카오맵 Places 서비스 초기화
            const ps = new window.kakao.maps.services.Places();
            
            // 카카오맵 검색 옵션 설정
            const searchOptions = {
              location: new window.kakao.maps.LatLng(groupData.x, groupData.y),
              radius: groupData.radius,
              category_group_code: 'FD6',
              size: 15,
              page: 1
            };

            // 카카오맵 검색 실행
            const kakaoResults = await new Promise((resolve, reject) => {
              ps.keywordSearch('맛집', (data: any, status: any) => {
                if (status === window.kakao.maps.services.Status.OK) {
                  resolve(data);
                } else {
                  reject(new Error('카카오맵 검색 실패'));
                }
              }, searchOptions);
            });

            // 별점 3.2 이상 필터링 및 데이터 변환
            const filteredKakao = (kakaoResults as any[])
              .filter((restaurant: any) => restaurant.rating >= 3.2)
              .map((restaurant: any) => ({
                id: restaurant.id || restaurant.kakao_id,
                name: restaurant.place_name,
                rating: restaurant.rating,
                address: restaurant.address_name,
                category: restaurant.category_name,
                type: 'kakao' as const,
                detail: restaurant
              }));
            allRestaurants.push(...filteredKakao);
          } catch (err) {
            console.error('카카오맵 API 호출 오류:', err);
          }
        }

        // 2. 배달 설정된 경우 요기요 API 호출
        if (groupData.delivery) {
          try {
            // 요기요 API 호출 (별점 4.7 이상 필터링)
            const yogiyoResponse = await fetch(`${BACKEND_URL}/groups/${groupId}/yogiyo-restaurants`);
            if (yogiyoResponse.ok) {
              const yogiyoData = await yogiyoResponse.json();
              const filteredYogiyo = yogiyoData.restaurants
                .filter((restaurant: any) => restaurant.review_avg >= 4.7)
                .map((restaurant: any) => ({
                  id: restaurant.id.toString(),
                  name: restaurant.name,
                  rating: restaurant.review_avg,
                  address: restaurant.address || '배달 가능 지역',
                  category: restaurant.categories.join(', '),
                  type: 'yogiyo' as const,
                  detail: restaurant
                }));
              allRestaurants.push(...filteredYogiyo);
            }
          } catch (err) {
            console.error('요기요 API 호출 오류:', err);
          }
        }

        // 3. 데이터 분배 로직 (카테고리별로 하나씩 선택)
        let finalRestaurants: Restaurant[] = [];
        
        if (groupData.offline && groupData.delivery) {
          // 둘 다 설정된 경우: 각각 카테고리별로 5개씩
          const kakaoRestaurants = allRestaurants.filter(r => r.type === 'kakao');
          const yogiyoRestaurants = allRestaurants.filter(r => r.type === 'yogiyo');
          
          // 카테고리별로 하나씩 선택하는 함수
          const selectByCategory = (restaurants: Restaurant[], maxCount: number): Restaurant[] => {
            const selected: Restaurant[] = [];
            const usedCategories = new Set<string>();
            
            // 카테고리별로 그룹화
            const categoryGroups = new Map<string, Restaurant[]>();
            restaurants.forEach(restaurant => {
              const category = normalizeCategory(restaurant.category);
              if (!categoryGroups.has(category)) {
                categoryGroups.set(category, []);
              }
              categoryGroups.get(category)!.push(restaurant);
            });
            
            // 각 카테고리에서 랜덤하게 하나씩 선택
            const categories = Array.from(categoryGroups.keys());
            const shuffledCategories = categories.sort(() => Math.random() - 0.5);
            
            for (const category of shuffledCategories) {
              if (selected.length >= maxCount) break;
              const categoryRestaurants = categoryGroups.get(category)!;
              const randomRestaurant = categoryRestaurants[Math.floor(Math.random() * categoryRestaurants.length)];
              selected.push(randomRestaurant);
              usedCategories.add(category);
            }
            // 만약 10개가 안 되면, 남은 식당에서 중복 없이 추가
            if (selected.length < maxCount) {
              // 이미 뽑힌 식당 id 집합
              const selectedIds = new Set(selected.map(r => r.id));
              // 남은 식당들
              const remaining = restaurants.filter(r => !selectedIds.has(r.id));
              // 랜덤하게 섞기
              const shuffled = remaining.sort(() => Math.random() - 0.5);
              for (const r of shuffled) {
                if (selected.length >= maxCount) break;
                selected.push(r);
              }
            }
            return selected;
          };
          
          // 방문 5개, 배달 5개 선택
          const selectedKakao = selectByCategory(kakaoRestaurants, 5);
          const selectedYogiyo = selectByCategory(yogiyoRestaurants, 5);
          
          finalRestaurants = [...selectedKakao, ...selectedYogiyo];
        } else {
          // 하나만 설정된 경우: 해당 데이터에서 카테고리별로 10개
          const selectByCategory = (restaurants: Restaurant[], maxCount: number): Restaurant[] => {
            const selected: Restaurant[] = [];
            const usedCategories = new Set<string>();
            
            // 카테고리별로 그룹화
            const categoryGroups = new Map<string, Restaurant[]>();
            restaurants.forEach(restaurant => {
              const category = normalizeCategory(restaurant.category);
              if (!categoryGroups.has(category)) {
                categoryGroups.set(category, []);
              }
              categoryGroups.get(category)!.push(restaurant);
            });
            
            console.log('카테고리별 그룹화 결과:', Object.fromEntries(categoryGroups));
            
            // 각 카테고리에서 랜덤하게 하나씩 선택
            const categories = Array.from(categoryGroups.keys());
            const shuffledCategories = categories.sort(() => Math.random() - 0.5);
            
            for (const category of shuffledCategories) {
              if (selected.length >= maxCount) break;
              
              const categoryRestaurants = categoryGroups.get(category)!;
              const randomRestaurant = categoryRestaurants[Math.floor(Math.random() * categoryRestaurants.length)];
              selected.push(randomRestaurant);
              usedCategories.add(category);
            }
            
            return selected;
          };
          
          finalRestaurants = selectByCategory(allRestaurants, 10);
        }

        // 4. 최종 결과 설정
        if (finalRestaurants.length === 0) {
          setError('조건에 맞는 식당을 찾을 수 없습니다.');
        } else {
          setRestaurants(finalRestaurants);
        }
      } catch (err) {
        console.error('식당 정보 가져오기 오류:', err);
        setError('식당 정보를 가져올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [groupData, groupId]);

  // 텍스트를 자동으로 줄바꿈하는 함수
  const formatTextForRoulette = (text: string): string => {
    // 지점 설명 제거 (예: "BHC-카이스트점" -> "BHC")
    const cleanName = text
      .replace(/[-_]\s*[가-힣\w\s]*점\s*$/, '') // "-점" 또는 "_점" 제거
      .replace(/[-_]\s*[가-힣\w\s]*지점\s*$/, '') // "-지점" 또는 "_지점" 제거
      .replace(/[-_]\s*[가-힣\w\s]*매장\s*$/, '') // "-매장" 또는 "_매장" 제거
      .replace(/[-_]\s*[가-힣\w\s]*스토어\s*$/, '') // "-스토어" 또는 "_스토어" 제거
      .replace(/[-_]\s*[가-힣\w\s]*센터\s*$/, '') // "-센터" 또는 "_센터" 제거
      .trim();
    
    // 텍스트 길이가 9글자 이상이면 두 줄로 나누기
    if (cleanName.length >= 9) {
      const mid = Math.ceil(cleanName.length / 2);
      const firstLine = cleanName.substring(0, mid);
      const secondLine = cleanName.substring(mid);
      return firstLine.split('').join(' ') + '  ' + secondLine.split('').join(' ');
    } else {
      // 9글자 미만이면 한 줄로
      return cleanName.split('').join(' ');
    }
  };

  // react-custom-roulette용 데이터 변환
  const rouletteData = restaurants.map((restaurant, index) => {
    const formattedText = formatTextForRoulette(restaurant.name);
    const isLongText = restaurant.name.replace(/[-_]\s*[가-힣\w\s]*점\s*$/, '').replace(/[-_]\s*[가-힣\w\s]*지점\s*$/, '').replace(/[-_]\s*[가-힣\w\s]*매장\s*$/, '').replace(/[-_]\s*[가-힣\w\s]*스토어\s*$/, '').replace(/[-_]\s*[가-힣\w\s]*센터\s*$/, '').trim().length >= 9;
    
    return {
      option: formattedText,
      style: { 
        backgroundColor: index % 4 === 0 ? '#FFE4E1' : // 파스텔 분홍색
                  index % 4 === 1 ? '#E6F3FF' : // 파스텔 하늘색
                  index % 4 === 2 ? '#F0FFF0' : // 파스텔 연두색
                  '#FFF8DC', // 파스텔 노란색
        textColor: '#4A4A4A',
        fontSize: isLongText ? 10 : 14, // 긴 텍스트는 폰트 크기 줄임
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: '1.1'
      }
    };
  });

  // 룰렛 돌리기
  const handleSpinClick = () => {
    if (!mustSpin) {
      const newPrizeNumber = Math.floor(Math.random() * restaurants.length);
      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
      setSelectedRestaurant(null);
    }
  };

  // 룰렛이 멈췄을 때 호출
  const handleStopSpinning = () => {
    setMustSpin(false);
    // 포인터 위치에 맞게 결과 인덱스 조정 (한 칸 왼쪽)
    const adjustedIndex = (prizeNumber - 1 + restaurants.length) % restaurants.length;
    setSelectedRestaurant(restaurants[adjustedIndex]);
  };

  // 홈으로 이동
  const handleGoHome = () => {
    router.push('/');
  };

  // 식당 클릭 시 상세정보/메뉴 모달
  const handleRestaurantClick = async (restaurant: Restaurant) => {
    console.log('식당 클릭됨:', restaurant);
    console.log('식당 타입:', restaurant.type);
    console.log('식당 상세정보:', restaurant.detail);
    console.log('요기요 ID 확인:', restaurant.detail?.id);
    console.log('카카오 ID 확인:', restaurant.detail?.kakao_id);
    
    if (restaurant.type === 'kakao' && restaurant.detail?.kakao_id) {
      console.log('카카오 모달 열기');
      setModalInfo({
        type: 'kakao',
        url: `https://place.map.kakao.com/${restaurant.detail.kakao_id}`,
        label: `카카오@https://place.map.kakao.com/${restaurant.detail.kakao_id}`
      });
      setModalOpen(true);
    } else if (restaurant.type === 'yogiyo' && restaurant.detail?.id) {
      console.log('요기요 메뉴 모달 열기');
      setMenuModalOpen(true);
      setMenuLoading(true);
      setMenuError(null);
      setMenuList([]);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/yogiyo-menu/${restaurant.detail.id}`);
        if (!res.ok) throw new Error("메뉴 정보를 불러올 수 없습니다");
        const data = await res.json();
        setMenuList(data.menus || []);
      } catch (e: any) {
        setMenuError(e.message || "메뉴 정보를 불러올 수 없습니다");
      } finally {
        setMenuLoading(false);
      }
    } else {
      console.log('기타 모달 열기 - 조건 확인:');
      console.log('- type이 yogiyo인가?', restaurant.type === 'yogiyo');
      console.log('- detail이 있는가?', !!restaurant.detail);
      console.log('- id가 있는가?', !!restaurant.detail?.id);
      setModalInfo({
        type: 'etc',
        url: '',
        label: restaurant.name
      });
      setModalOpen(true);
    }
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h2>오류 발생</h2>
          <p>{error}</p>
          <button
            onClick={handleGoHome}
            style={{ 
              background: "#dc3545", 
              color: "#fff", 
              border: "none", 
              borderRadius: "25px", 
              padding: "12px 24px", 
              fontSize: "16px", 
              fontWeight: "bold", 
              cursor: "pointer",
              transition: "all 0.3s ease",
              marginTop: "20px"
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
            홈으로
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>
          <h2>식당 정보를 가져오는 중...</h2>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h2>😔 조건에 맞는 식당을 찾을 수 없어요</h2>
          <p>다음 중 하나를 시도해보세요:</p>
          <ul style={{ textAlign: 'left', marginTop: '15px' }}>
            <li>• 배달 시간을 늘려보세요</li>
            <li>• 방문 가능 거리를 늘려보세요</li>
            <li>• 다른 위치를 선택해보세요</li>
          </ul>
          <button
            onClick={handleGoHome}
            style={{ 
              background: "#dc3545", 
              color: "#fff", 
              border: "none", 
              borderRadius: "25px", 
              padding: "12px 24px", 
              fontSize: "16px", 
              fontWeight: "bold", 
              cursor: "pointer",
              transition: "all 0.3s ease",
              marginTop: "20px"
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
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🍽️ 랜덤 식당 룰렛 🍽️</h1>
        <p>무엇을 먹을까요?</p>
        {restaurants.length < 10 && restaurants.length > 0 && (
          <>
          <p style={{ color: '#ffd700', fontSize: '0.9rem', marginTop: '10px'}}>
            ⚠️ 조건에 맞는 식당이 {restaurants.length}개만 있어요.
          </p>
          <p style={{ color: '#ffd700', fontSize: '0.8rem', marginTop: '0px' }}>
          더 많은 식당을 찾기 위해 조건을 조정해보세요!
        </p>
        </>
        )}
      </div>

      <div className={styles.wheelContainer}>
        {/* react-custom-roulette 룰렛 */}
        <div className={styles.wheelWrapper}>
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={rouletteData}
            onStopSpinning={handleStopSpinning}
            backgroundColors={['#ff6b6b', '#4ecdc4']}
            textColors={['white']}
            fontSize={12}
            fontWeight="bold"
            spinDuration={0.8}
            innerRadius={0}
            innerBorderColor="#333"
            innerBorderWidth={3}
            outerBorderColor="#333"
            outerBorderWidth={3}
            radiusLineColor="#333"
            radiusLineWidth={1}
            perpendicularText={false}
            textDistance={50}
          />
        </div>

        {/* GO! 버튼 */}
        <button
          className={`${styles.spinButton} ${mustSpin ? styles.spinning : ''}`}
          onClick={handleSpinClick}
          disabled={mustSpin || restaurants.length === 0}
        >
          {mustSpin ? '돌리는 중...' : 'GO!'}
        </button>
      </div>

      {/* 결과 표시 */}
      {selectedRestaurant && (
        <div className={styles.resultContainer}>
          <h2>🎉 오늘의 식당! 🎉</h2>
          <div 
            className={styles.resultCard}
            onClick={() => handleRestaurantClick(selectedRestaurant)}
            style={{ cursor: 'pointer' }}
          >
            <h3>{selectedRestaurant.name}</h3>
            <p className={styles.rating}>⭐ {selectedRestaurant.rating}</p>
            <p className={styles.category}>{selectedRestaurant.category}</p>
            <p className={styles.address}>{selectedRestaurant.address}</p>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
              👆 클릭하여 상세정보 보기
            </p>
          </div>
        </div>
      )}

      {/* 식당 리스트 */}
      <div className={styles.restaurantList}>
        <h3>후보 식당들</h3>
        <div className={styles.listContainer}>
          {restaurants.map((restaurant, index) => (
            <div 
              key={restaurant.id} 
              className={styles.restaurantItem}
              onClick={() => handleRestaurantClick(restaurant)}
              style={{ cursor: 'pointer' }}
            >
              <span className={styles.itemNumber}>{index + 1}</span>
              <div className={styles.itemInfo}>
                <h4>{restaurant.name}</h4>
                <p>⭐ {restaurant.rating} • {restaurant.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 버튼 그룹 */}
      <div style={{ marginTop: "30px", marginBottom: "30px", textAlign: "center", display: "flex", gap: "15px", justifyContent: "center" }}>
        <button
          onClick={handleGoHome}
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
          홈으로
        </button>
      </div>

      {/* 상세정보 모달 */}
      {modalOpen && modalInfo && (
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
              background: "#fff", borderRadius: 12, width: "90vw", maxWidth: 600, height: "80vh", position: "relative", padding: 0, textAlign: 'center', overflow: 'hidden'
            }}
          >
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: "absolute", top: 10, right: 10, background: "none", border: "none", fontSize: 24, cursor: "pointer", zIndex: 2
              }}
            >✕</button>
            {modalInfo.type === 'kakao' ? (
              <iframe
                src={modalInfo.url}
                style={{ width: "100%", height: "100%", border: "none", borderRadius: 12 }}
                title="카카오 플레이스"
              />
            ) : modalInfo.type === 'yogiyo' ? (
              <>
                <div style={{fontWeight:'bold', marginBottom:8}}>요기요</div>
                <a href={modalInfo.url} target="_blank" rel="noopener noreferrer" style={{color:'#994d52', wordBreak:'break-all'}}>{modalInfo.label}</a>
              </>
            ) : modalInfo.type === 'custom' ? (
              <>
                <div style={{fontWeight:'bold', marginBottom:8}}>커스텀 링크</div>
                <a href={modalInfo.url} target="_blank" rel="noopener noreferrer" style={{color:'#994d52', wordBreak:'break-all'}}>{modalInfo.label}</a>
              </>
            ) : (
              <div>{modalInfo.label}</div>
            )}
          </div>
        </div>
      )}

      {/* 요기요 메뉴 모달 */}
      {menuModalOpen && (
        <div
          onClick={() => setMenuModalOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, width: "90vw", maxWidth: 500, maxHeight: '80vh', overflowY: 'auto', position: "relative", padding: 24, textAlign: 'center'
            }}
          >
            <button
              onClick={() => setMenuModalOpen(false)}
              style={{
                position: "absolute", top: 10, right: 10, background: "none", border: "none", fontSize: 24, cursor: "pointer", color: '#222'
              }}
            >✕</button>
            <h3 style={{fontWeight:'bold', marginBottom:16, fontSize:20, color:'#222'}}>메뉴</h3>
            {menuLoading ? (
              <div style={{color:'#999', padding:40}}>메뉴 불러오는 중...</div>
            ) : menuError ? (
              <div style={{color:'#e57373', padding:40}}>{menuError}</div>
            ) : menuList.length === 0 ? (
              <div style={{color:'#999', padding:40}}>메뉴가 없습니다</div>
            ) : (
              <div style={{display:'flex', flexWrap:'wrap', gap:20, justifyContent:'center'}}>
                {menuList.map((menu, idx) => (
                  <div key={menu.name + '-' + idx} style={{width:120, textAlign:'center'}}>
                    {menu.image ? (
                      <img src={menu.image} alt={menu.name} style={{width:100, height:80, objectFit:'cover', borderRadius:8, marginBottom:8}} />
                    ) : (
                      <div style={{width:100, height:80, background:'#eee', borderRadius:8, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', fontSize:13}}>
                        이미지 없음
                      </div>
                    )}
                    <div style={{fontSize:14, color:'#222', fontWeight:500}}>{menu.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 