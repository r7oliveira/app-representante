importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD7FjlCtIZNL7YT6DU7P5FBM2AI7Qx2z1o",
  projectId: "romance-indicacoes",
  messagingSenderId: "1000995187899",
  appId: "1:1000995187899:web:af4c97957e8f10bb42cd9e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const titulo = (payload.notification && payload.notification.title) || 'Atendimento em breve';
  const corpo = (payload.notification && payload.notification.body) || '';
  self.registration.showNotification(titulo, {
    body: corpo
  });
});

const CACHE = 'gestao-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
