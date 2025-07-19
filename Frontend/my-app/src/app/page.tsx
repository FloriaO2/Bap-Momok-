'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function HomePage() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const router = useRouter();

  // Create Room 모달 상태
  const [createRoomData, setCreateRoomData] = useState({
    location: '',
    startTime: '',
    delivery: false,
    deliveryTime: '30',
    visit: false,
    visitTime: '10'
  });

  // 방 참여 함수
  const joinRoom = (inputRoomId: string) => {
    console.log('joinRoom 함수 호출됨, inputRoomId:', inputRoomId);
    
    if (inputRoomId && inputRoomId.trim()) {
      console.log('방 ID가 유효함, 카카오지도 화면으로 이동');
      // URL 파라미터로 방 ID 전달
      router.push(`/map?roomId=${encodeURIComponent(inputRoomId.trim())}`);
      setShowJoinModal(false);
      setJoinRoomInput('');
    } else {
      console.log('방 ID가 유효하지 않음');
      alert('방 ID를 입력해주세요.');
    }
  };

  // 방 참여 모달 열기
  const openJoinModal = () => {
    console.log('방 참여 모달 열기');
    setShowJoinModal(true);
  };

  // 방 참여 모달 닫기
  const closeJoinModal = () => {
    setShowJoinModal(false);
    setJoinRoomInput('');
  };

  // Create Room 모달 열기
  const openCreateModal = () => {
    console.log('Create Room 모달 열기');
    setShowCreateModal(true);
  };

  // Create Room 모달 닫기
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateRoomData({
      location: '',
      startTime: '',
      delivery: false,
      deliveryTime: '30',
      visit: false,
      visitTime: '10'
    });
  };

  // Create Room 데이터 업데이트
  const updateCreateRoomData = (field: string, value: any) => {
    setCreateRoomData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 방 생성 함수
  const createRoom = () => {
    console.log('방 생성 데이터:', createRoomData);
    
    if (!createRoomData.location.trim()) {
      alert('위치를 입력해주세요.');
      return;
    }
    
    if (!createRoomData.startTime) {
      alert('투표 시작 시간을 선택해주세요.');
      return;
    }

    // 여기에 실제 방 생성 로직을 추가할 수 있습니다
    alert('방이 생성되었습니다!');
    closeCreateModal();
  };

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
          {/* 메인 콘텐츠 */}
          <div className={styles.content}>
            {/* 타이틀 */}
            <h1 className={styles.title}>Bap! Momok?</h1>
            
            {/* 버튼 컨테이너 */}
            <div className={styles.buttonContainer}>
              {/* Create Room 버튼 */}
              <button 
                className={styles.createButton}
                onClick={openCreateModal}
              >
                Create Room
              </button>
              
              {/* Join Room 버튼 */}
              <button 
                className={styles.joinButton}
                onClick={openJoinModal}
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Join Room 모달 */}
      {showJoinModal && (
        <div className={styles.modalOverlay} onClick={closeJoinModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>방 참여</h2>
            <input
              className={styles.modalInput}
              type="text"
              placeholder="방 ID를 입력하세요"
              value={joinRoomInput}
              onChange={(e) => setJoinRoomInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  joinRoom(joinRoomInput);
                }
              }}
            />
            <button
              className={styles.modalButton}
              onClick={() => joinRoom(joinRoomInput)}
            >
              참여
            </button>
            <button
              className={styles.modalButton}
              onClick={closeJoinModal}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Create Room 모달 */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={closeCreateModal}>
          <div className={styles.createModalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>그룹 생성</h2>
            
            {/* 위치 입력 */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>📍 현재 위치</label>
              <input
                className={styles.modalInput}
                type="text"
                placeholder="현재 위치"
                value={createRoomData.location}
                onChange={(e) => updateCreateRoomData('location', e.target.value)}
              />
            </div>

            {/* 투표 시작 시간 */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>🕐 회의 시작 시간</label>
              <input
                className={styles.modalInput}
                type="datetime-local"
                value={createRoomData.startTime}
                onChange={(e) => updateCreateRoomData('startTime', e.target.value)}
              />
            </div>

            {/* Delivery 옵션 */}
            <div className={styles.optionGroup}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="delivery"
                  checked={createRoomData.delivery}
                  onChange={(e) => updateCreateRoomData('delivery', e.target.checked)}
                  className={styles.checkbox}
                />
                <label htmlFor="delivery" className={styles.checkboxLabel}>Delivery</label>
              </div>
              {createRoomData.delivery && (
                <select
                  className={styles.timeSelect}
                  value={createRoomData.deliveryTime}
                  onChange={(e) => updateCreateRoomData('deliveryTime', e.target.value)}
                >
                  <option value="10">10분</option>
                  <option value="20">20분</option>
                  <option value="30">30분</option>
                  <option value="40">40분</option>
                  <option value="50">50분</option>
                  <option value="60">60분</option>
                  <option value="0">무관</option>
                </select>
              )}
            </div>

            {/* Visit 옵션 */}
            <div className={styles.optionGroup}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="visit"
                  checked={createRoomData.visit}
                  onChange={(e) => updateCreateRoomData('visit', e.target.checked)}
                  className={styles.checkbox}
                />
                <label htmlFor="visit" className={styles.checkboxLabel}>Visit</label>
              </div>
              {createRoomData.visit && (
                <select
                  className={styles.timeSelect}
                  value={createRoomData.visitTime}
                  onChange={(e) => updateCreateRoomData('visitTime', e.target.value)}
                >
                  <option value="5">5분</option>
                  <option value="10">10분</option>
                  <option value="20">20분</option>
                  <option value="30">30분</option>
                  <option value="40">40분</option>
                </select>
              )}
            </div>

            {/* 버튼들 */}
            <div className={styles.modalButtonGroup}>
              <button
                className={styles.modalButton}
                onClick={createRoom}
              >
                Create room
              </button>
              <button
                className={styles.modalButton}
                onClick={closeCreateModal}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
