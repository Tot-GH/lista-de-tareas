const NOMBRE_CACHE = 'cache-tareas-v1';
const ARCHIVOS_ESTATICOS = [
    './',
    './index.html',
    './index.js',
    './manifest.json',
    'https://cdn-icons-png.flaticon.com/512/2693/2693507.png' // Tu ícono externo
];

// Instalar y guardar los recursos estáticos en caché (Cache First)
self.addEventListener('install', function(evento) {
    evento.waitUntil(
        caches.open(NOMBRE_CACHE).then(function(cache) {
            console.log('-> SW: Guardando archivos estáticos en caché');
            return cache.addAll(ARCHIVOS_ESTATICOS);
        })
    );
    self.skipWaiting(); 
});

// Interceptar peticiones para activar el soporte offline (Cache First)
self.addEventListener('fetch', function(evento) {
    evento.respondWith(
        caches.match(evento.request).then(function(respuestaCache) {
            // Si el archivo fue encontrado en la caché, lo sirve localmente
            if (respuestaCache) {
                return respuestaCache;
            }
            // Si no estaba en la caché, va a internet
            return fetch(evento.request);
        })
    );
});

// Activar y limpiar cachés antiguas
self.addEventListener('activate', function(evento) {
    const listaBlancaCaches = [NOMBRE_CACHE];

    evento.waitUntil(
        caches.keys().then(function(nombresCache) {
            return Promise.all(
                nombresCache.map(function(nombreCache) {
                    if (listaBlancaCaches.indexOf(nombreCache) === -1) {
                        console.log('-> SW: Eliminando caché antigua:', nombreCache);
                        return caches.delete(nombreCache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// RELOJ EN SEGUNDO PLANO USANDO INDEXEDDB DIRECTAMENTE
setInterval(function() {
  // Abrimos la base de datos desde el Service Worker de forma asíncrona
  const peticionConexion = indexedDB.open('lista-tareas-db', 1);

  peticionConexion.onsuccess = function(evento) {
    const db = evento.target.result;
    
    // Verificamos si existe el almacén de objetos para evitar errores en cargas tempranas
    if (!db.objectStoreNames.contains('tareas')) return;

    const transaccion = db.transaction('tareas', 'readwrite');
    const almacen = transaccion.objectStore('tareas');
    const peticionGetAll = almacen.getAll();

    peticionGetAll.onsuccess = function(e) {
      const tareasEnSegundoPlano = e.target.result || [];
      if (tareasEnSegundoPlano.length === 0) return;

      const ahora = new Date();
      const horaActual = ahora.getHours().toString().padStart(2, '0') + ":" + 
                         ahora.getMinutes().toString().padStart(2, '0');

      tareasEnSegundoPlano.forEach(function(tarea) {
        // Validamos la hora y que estrictamente NO haya sido notificada
        if (tarea.hora === horaActual && tarea.notificada === false) {
          
          // 1. Modificamos el estado de la tarea en IndexedDB directamente
          tarea.notificada = true;
          almacen.put(tarea); // Guarda el objeto actualizado en la BD

          // 2. Lanzamos la notificación push local nativa
          self.registration.showNotification("⏰ ¡Es hora de tu tarea!", {
            body: tarea.texto,
            icon: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png",
            badge: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png"
          });

          console.log(`-> SW: Notificación enviada para la tarea: "${tarea.texto}"`);

          // 3. Avisamos a las pestañas abiertas que IndexedDB cambió para que refresquen la UI
          self.clients.matchAll().then(function(clientes) {
            clientes.forEach(function(cliente) {
              cliente.postMessage({
                tipo: 'TAREA_NOTIFICADA_GLOBAL',
                id: tarea.id
              });
            });
          });
        }
      });
    };
  };

  peticionConexion.onerror = function() {
    // Falla silenciosa o logs ligeros para no saturar la consola del SW
    console.log('-> SW: No se pudo abrir la BD para verificar alertas programadas.');
  };
}, 1000);