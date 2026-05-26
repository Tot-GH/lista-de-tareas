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
        });
        renderizarTareas();
        nombreTarea.value = "";
        horaTarea.value = "";
    }
});

function renderizarTareas(){
    listaTareas.innerHTML="";

    tareas.forEach(function(tarea, indice){
        const nuevaTarea = document.createElement('li');
        nuevaTarea.textContent=tarea.texto + " - " + (tarea.hora || "Sin hora") + " ";

        const botonEliminar = document.createElement('button');
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener('click', function(){
            tareas.splice(indice, 1);
            renderizarTareas();
        });

        nuevaTarea.appendChild(botonEliminar);
        listaTareas.appendChild(nuevaTarea);
    });

    localStorage.setItem('misTareas', JSON.stringify(tareas));

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            tipo: 'ACTUALIZAR_TAREAS',
            lista: tareas
        });
    }
}

renderizarTareas();

botonPermiso.addEventListener('click', function() {
    console.log("Solicitando permiso desde un botón real...");
    
    Notification.requestPermission().then(function(permiso) {
        console.log("Respuesta del navegador:", permiso);
        
        if (permiso === "granted") {
            alert("¡Perfecto! Notificaciones del sistema activadas con éxito. 🔔");
            botonPermiso.style.display = "none"; // Escondemos el botón porque ya no se necesita
        } else if (permiso === "denied") {
            alert("El navegador bloqueó la solicitud. Recuerda desbloquearlo desde el candado de la barra de direcciones.");
        }
    });
});

if (Notification.permission === "granted") {
    botonPermiso.style.display = "none";
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(function(registro) {
            console.log("¡Service Worker registrado con éxito en el dispositivo!", registro.scope);
        })
        .catch(function(error) {
            console.error("Error al registrar el Service Worker:", error);
        });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function(evento) {
        if (evento.data && evento.data.tipo === 'TAREA_NOTIFICADA_EN_SW') {
            // Buscamos la tarea en nuestra lista local y la marcamos como notificada
            tareas = tareas.map(function(tarea) {
                if (tarea.texto === evento.data.texto) {
                    tarea.notificada = true;
                }
                return tarea;
            });
            // Guardamos en LocalStorage y re-dibujamos la pantalla sin romper nada
            localStorage.setItem('misTareas', JSON.stringify(tareas));
            renderizarTareas();
        }
    });
}