// Mostra as notificações (push) quando o app está fechado. Deve ficar na MESMA pasta do app (ao lado do sw.js).
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD7FjlCtIZNL7YT6DU7P5FBM2AI7Qx2z1o",
  authDomain: "romance-indicacoes.firebaseapp.com",
  projectId: "romance-indicacoes",
  storageBucket: "romance-indicacoes.firebasestorage.app",
  messagingSenderId: "1000995187899",
  appId: "1:1000995187899:web:af4c97957e8f10bb42cd9e"
});

const messaging = firebase.messaging();

// Mensagem chegou com o app fechado/em segundo plano: mostra a notificação.
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  const n = payload.notification || {};
  const titulo = d.titulo || n.title || 'Gestão do Distribuidor';
  const corpo = d.corpo || n.body || '';
  return self.registration.showNotification(titulo, { body: corpo, data: { url: d.url || (self.location.origin + '/') } });
});

// Tocou na notificação: abre (ou traz pra frente) o app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const c of lista) { if ('focus' in c) return c.focus(); }
      return clients.openWindow(url);
    })
  );
});
