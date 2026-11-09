// Gestão · mostra as notificações (Web Push) quando o app está fechado.
// Deve ficar na MESMA pasta do app (ao lado do gestao-rep-v12.html e do sw.js).

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { corpo: event.data ? event.data.text() : '' }; }
  const titulo = d.titulo || 'Gestão';
  // No iPhone toda notificação recebida PRECISA ser mostrada; por isso sempre chamamos showNotification.
  event.waitUntil(self.registration.showNotification(titulo, {
    body: d.corpo || '',
    tag: d.tag || undefined,
    data: { url: d.url || self.location.origin + '/' },
  }));
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
