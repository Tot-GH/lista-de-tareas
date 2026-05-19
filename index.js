const nombreTarea = document.getElementById('nombre-tarea');
const botónAgregarTarea = document.getElementById('botón-agregar-tarea');
const listaTareas = document.getElementById('lista-tareas');

let tareas = JSON.parse(localStorage.getItem('misTareas')) || [];

botónAgregarTarea.addEventListener('click', function() {
    const textoDeLaTarea = nombreTarea.value;

    if (textoDeLaTarea !== ""){

        tareas.push({ texto: textoDeLaTarea });
        renderizarTareas();
        nombreTarea.value = "";
    }
});

function renderizarTareas(){
    listaTareas.innerHTML="";

    tareas.forEach(function(tarea, indice){
        const nuevaTarea = document.createElement('li');
        nuevaTarea.textContent=tarea.texto + " ";

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

renderizarTareas();