let tareasEnSegundoPlano = [];

self.addEventListener('install', function(evento) {
    console.log("-> Service Worker: Instalando en el dispositivo...");
    self.skipWaiting(); 
});

self.addEventListener('activate', function(evento) {
    console.log("-> Service Worker: ¡Activado y corriendo en segundo plano!");
    return self.clients.claim();
});

self.addEventListener('message', function(evento) {
    if (evento.data && evento.data.tipo === 'ACTUALIZAR_TAREAS') {
        tareasEnSegundoPlano = evento.data.lista;
        console.log("-> SW: Lista de tareas sincronizada en segundo plano:", tareasEnSegundoPlano);
    }
});

setInterval(function() {
    if (tareasEnSegundoPlano.length === 0) return;

    const ahora = new Date();
    const horaActual = ahora.getHours().toString().padStart(2, '0') + ":" + ahora.getMinutes().toString().padStart(2, '0');

    tareasEnSegundoPlano.forEach(function(tarea) {
        if (tarea.hora === horaActual && !tarea.notificada) {
            
            // Lanzamos la notificación real directamente desde el sistema operativo
            self.registration.showNotification("⏰ ¡Es hora de tu tarea!", {
                body: tarea.texto,
                icon: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png",
                badge: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png" // Icono pequeño para la barra de estado en celulares
            });

            tarea.notificada = true;
            
            // Le avisamos de vuelta a la interfaz (index.js) que marcamos la tarea como notificada
            self.clients.matchAll().then(function(clientes) {
                clientes.forEach(function(cliente) {
                    cliente.postMessage({
                        tipo: 'TAREA_NOTIFICADA_EN_SW',
                        texto: tarea.texto
                    });
                });
            });
        }
    });
}, 1000);