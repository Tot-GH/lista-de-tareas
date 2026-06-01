let tareasEnSegundoPlano = [];

self.addEventListener('install', function(evento) {
    self.skipWaiting(); 
});

self.addEventListener('activate', function(evento) {
    return self.clients.claim();
});

// Solo escuchamos para actualizar la lista limpia
self.addEventListener('message', function(evento) {
    if (evento.data && evento.data.tipo === 'ACTUALIZAR_TAREAS') {
        tareasEnSegundoPlano = evento.data.lista;
        console.log("-> SW: Lista actualizada:", tareasEnSegundoPlano);
    }
    if (evento.data.tipo === 'PEDIR_ESTADO_ACTUAL') {
        self.clients.matchAll().then(function(clientes) {
            clientes.forEach(function(cliente) {
                cliente.postMessage({
                    tipo: 'SINCRONIZACION_AL_DESPERTAR',
                    lista: tareasEnSegundoPlano
                });
            });
        });
    }
});

// Reloj en segundo plano
setInterval(function() {
    if (tareasEnSegundoPlano.length === 0) return;

    const ahora = new Date();
    const horaActual = ahora.getHours().toString().padStart(2, '0') + ":" + ahora.getMinutes().toString().padStart(2, '0');

    tareasEnSegundoPlano.forEach(function(tarea) {
        // CONDICIÓN CRÍTICA: Validamos la hora y que estrictamente NO haya sido notificada aquí
        if (tarea.hora === horaActual && tarea.notificada === false) {
            
            // 1. LA VOLVEMOS TRUE INMEDIATAMENTE (Freno de mano instantáneo)
            tarea.notificada = true;

            // 2. Lanzamos la notificación
            self.registration.showNotification("⏰ ¡Es hora de tu tarea!", {
                body: tarea.texto,
                icon: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png",
                badge: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png"
            });
            
            // 3. Avisamos a la interfaz para que actualice su localStorage permanentemente
            self.clients.matchAll().then(function(clientes) {
                clientes.forEach(function(cliente) {
                    cliente.postMessage({
                        tipo: 'TAREA_NOTIFICADA_GLOBAL',
                        texto: tarea.texto,
                        hora: tarea.hora,
                        id: tarea.id,
                    });
                });
            });
        }
    });
}, 1000);