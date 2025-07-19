'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TinderCard from 'react-tinder-card';
import styles from './tinder.module.css';

export default function TinderPage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const router = useRouter();

  // 사람 이름 카드 데이터
  const peopleCards = [
    { id: 1, name: '김철수', emoji: '👨' },
    { id: 2, name: '이영희', emoji: '👩' },
    { id: 3, name: '박민수', emoji: '👨‍🦱' },
    { id: 4, name: '최지영', emoji: '👩‍🦰' },
    { id: 5, name: '정현우', emoji: '👨‍💼' },
    { id: 6, name: '한소영', emoji: '👩‍💼' },
    { id: 7, name: '윤태호', emoji: '👨‍🎓' },
    { id: 8, name: '송미라', emoji: '👩‍🎓' },
  ];

  // 카드 스와이프 처리
  const onSwipe = (direction: string, cardId: number) => {
    const card = peopleCards.find(c => c.id === cardId);
    
    let directionText = '';
    switch (direction) {
      case 'up':
        directionText = '⬆️ 위쪽';
        break;
      case 'down':
        directionText = '⬇️ 아래쪽';
        break;
      case 'left':
        directionText = '⬅️ 왼쪽';
        break;
      case 'right':
        directionText = '➡️ 오른쪽';
        break;
    }
    
    console.log(`${directionText}으로 스와이프: ${card?.name}`);
    
    setCurrentCardIndex(prev => prev + 1);
  };

  // 카드가 화면을 벗어났을 때
  const onCardLeftScreen = (cardId: number) => {
    console.log(`${cardId} 카드가 화면을 벗어났습니다.`);
  };

  // 홈으로 돌아가기
  const goHome = () => {
    router.push('/');
  };

  // 카드가 끝났을 때
  if (currentCardIndex >= peopleCards.length) {
    return (
      <div className={styles.container}>
        <div 
          className={styles.backgroundImage}
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)'
          }}
        >
          <div className={styles.overlay}>
            <div className={styles.completionContainer}>
              <h2 className={styles.completionTitle}>모든 사람을 확인했습니다!</h2>
              <p className={styles.completionText}>결과를 확인하시겠습니까?</p>
              <div className={styles.completionButtons}>
                <button 
                  className={styles.completionButton}
                  onClick={() => setCurrentCardIndex(0)}
                >
                  다시하기
                </button>
                <button 
                  className={styles.completionButton}
                  onClick={goHome}
                >
                  홈으로
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = peopleCards[currentCardIndex];
  
  return (
    <div className={styles.container}>
      {/* 배경 이미지 */}
      <div 
        className={styles.backgroundImage}
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)'
        }}
      >
        {/* 오버레이 그라데이션 */}
        <div className={styles.overlay}>
          {/* 헤더 */}
          <div className={styles.cardHeader}>
            <button 
              className={styles.backButton}
              onClick={goHome}
            >
              ← 홈으로
            </button>
            <h2 className={styles.cardTitle}>사람 선택하기</h2>
            <span className={styles.progressText}>{currentCardIndex + 1} / {peopleCards.length}</span>
          </div>
          
          {/* 카드 컨테이너 */}
          <div className={styles.cardContainer}>
            <TinderCard
              key={currentCard.id}
              onSwipe={(dir) => onSwipe(dir, currentCard.id)}
              onCardLeftScreen={() => onCardLeftScreen(currentCard.id)}
              preventSwipe={[]}
              swipeThreshold={20}
              swipeRequirementType="position"
            >
              <div className={styles.card}>
                <div className={styles.cardEmoji}>{currentCard.emoji}</div>
                <div className={styles.cardName}>{currentCard.name}</div>
              </div>
            </TinderCard>
          </div>
          
          {/* 방향 안내 */}
          <div className={styles.directionContainer}>
            <div className={styles.directionRow}>
              <div className={styles.directionItem}>
                <span className={styles.directionText}>⬆️ 위쪽</span>
              </div>
            </div>
            <div className={styles.directionRow}>
              <div className={styles.directionItem}>
                <span className={styles.directionText}>⬅️ 왼쪽</span>
              </div>
              <div className={styles.directionItem}>
                <span className={styles.directionText}>오른쪽 ➡️</span>
              </div>
            </div>
            <div className={styles.directionRow}>
              <div className={styles.directionItem}>
                <span className={styles.directionText}>아래쪽 ⬇️</span>
              </div>
            </div>
          </div>
          
          {/* 안내 텍스트 */}
          <div className={styles.instructionContainer}>
            <p className={styles.instructionText}>
              카드를 원하는 방향으로 스와이프하세요!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 