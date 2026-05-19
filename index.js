const nombreTarea = document.getElementById('nombre-tarea');
const horaTarea = document.getElementById('hora-tarea');
const botónAgregarTarea = document.getElementById('botón-agregar-tarea');
const listaTareas = document.getElementById('lista-tareas');

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
}

    setInterval(function(){
        const ahora = new Date();
        const horaActual = ahora.getHours().toString().padStart(2, '0') + ":" + ahora.getMinutes().toString().padStart(2, '0');
        tareas.forEach(function(tarea){
            if(tarea.hora === horaActual && !tarea.notificada){
                alert("⏰ ¡Es hora de tu tarea!: " + tarea.texto);

                tarea.notificada = true;
                renderizarTareas()
            }
        });
    },1000);
renderizarTareas();