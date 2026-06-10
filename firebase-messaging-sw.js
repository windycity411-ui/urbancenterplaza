// =====================================================
// 어반센터프라자 — Firebase Messaging Service Worker
// PWA 오프라인 캐싱 + FCM 백그라운드 알림 처리
// =====================================================

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase 초기화 (index.html과 동일한 설정)
firebase.initializeApp({
  apiKey: "AIzaSyCsaSnMaAgCUSVDjLm9Ra1cr0aOFncN42M",
  authDomain: "urbancenterplaza.firebaseapp.com",
  projectId: "urbancenterplaza",
  storageBucket: "urbancenterplaza.firebasestorage.app",
  appId: "1:171692889997:web:333e87256d026387674fc4"
});

const messaging = firebase.messaging();

// ─── 캐시 설정 ────────────────────────────────────────
const CACHE_NAME = 'ucp-cache-v1';
const CACHE_URLS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

// 활성화: 이전 버전 캐시 삭제
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: 네트워크 우선, 실패 시 캐시 반환 (HTML 페이지 한정)
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
  }
});

// ─── FCM 백그라운드 메시지 처리 ──────────────────────
// 앱이 백그라운드 또는 닫힌 상태일 때 FCM 메시지 수신
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '어반센터프라자';
  const body  = payload.notification?.body  || '';
  const icon  = payload.notification?.icon  || './icon-192.png';

  self.registration.showNotification(title, {
    body,
    icon,
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data || {}
  });
});

// ─── 알림 클릭: 앱 포커스 또는 새 탭 열기 ────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const app = list.find(c => c.url.includes('index.html'));
      if (app) return app.focus();
      return clients.openWindow('./index.html');
    })
  );
});
