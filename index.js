const nombreTarea = document.getElementById('nombre-tarea');
const horaTarea = document.getElementById('hora-tarea');
const botónAgregarTarea = document.getElementById('botón-agregar-tarea');
const listaTareas = document.getElementById('lista-tareas');
const botonPermiso = document.getElementById('boton-activar-notificaciones');

let tareas = JSON.parse(localStorage.getItem('misTareas')) || [];

botónAgregarTarea.addEventListener('click', function() {
    const textoDeLaTarea = nombreTarea.value;
    const valorHoraTarea = horaTarea.value;

    if (textoDeLaTarea !== ""){
        tareas.push({ 
            texto: textoDeLaTarea,
            hora: valorHoraTarea,
            notificada: false,
            id: crypto.randomUUID(textoDeLaTarea),
        });
        renderizarTareas();
        sincronizarConServiceWorker();
        nombreTarea.value = "";
        horaTarea.value = "";
    }
});

function renderizarTareas(){
    listaTareas.innerHTML = "";

    tareas.forEach(function(tarea, indice){
        const nuevaTarea = document.createElement('li');
        nuevaTarea.textContent = tarea.texto + " - " + (tarea.hora || "Sin hora") + " ";

        const botonEliminar = document.createElement('button');
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener('click', function(){
            tareas = tareas.filter(t => t.id !== tarea.id);
            renderizarTareas();
            sincronizarConServiceWorker();
        });

        nuevaTarea.appendChild(botonEliminar);
        listaTareas.appendChild(nuevaTarea);
    });

    localStorage.setItem('misTareas', JSON.stringify(tareas));

}

function sincronizarConServiceWorker() {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            tipo: 'ACTUALIZAR_TAREAS',
            lista: tareas
        });
    }
}

// Gestión del botón de permisos
botonPermiso.addEventListener('click', function() {
    Notification.requestPermission().then(function(permiso) {
        if (permiso === "granted") {
            alert("¡Perfecto! Notificaciones activadas. 🔔");
            botonPermiso.style.display = "none";
        }
    });
});

if (Notification.permission === "granted") {
    botonPermiso.style.display = "none";
}

// Registro y escucha del Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(evento) {
        if (!evento.data) return;

        // Cuando el SW nos diga que ya quemó la tarea, la marcamos aquí de forma fulminante
        if (evento.data.tipo === 'TAREA_NOTIFICADA_GLOBAL') {
            tareas = tareas.map(function(tarea) {
                if (tarea.id === evento.data.id) {
                    tarea.notificada = true;
                }
                return tarea;
            });
            localStorage.setItem('misTareas', JSON.stringify(tareas));
            renderizarTareas();
        }

        if (evento.data.tipo === 'SINCRONIZACION_AL_DESPERTAR') {
            // Solo sincronizamos si el Service Worker realmente ya tenía tareas guardadas en su memoria
            if (evento.data.lista && evento.data.lista.length > 0) {
                console.log("-> Interfaz: ¡localStorage actualizado con los datos reales del SW!");
                tareas = evento.data.lista;
                localStorage.setItem('misTareas', JSON.stringify(tareas));
                renderizarTareas();
            }
        }
    });

    navigator.serviceWorker.register('sw.js')
        .then(function(registro) {
            console.log("¡Service Worker activo!", registro.scope); 
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ tipo: 'PEDIR_ESTADO_ACTUAL' });
            }
        })
        .catch(function(error) {
            console.error("Error:", error);
        });
}

renderizarTareas();