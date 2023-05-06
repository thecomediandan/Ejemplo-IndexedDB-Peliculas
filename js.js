"strict mode";
// En esta varible IDBRequest alojamos la solucitud de apertura
// indexedDB.open("nameDatabase", 1) abrimos la db asignando el nombre y su version
// En caso de no encontrar la base de datos la creará
const idbRequest = indexedDB.open("Movies", 1);

idbRequest.addEventListener("upgradeneeded", ()=>{
    console.log("Se actualizó la base de datos");
    const db = idbRequest.result;
    db.createObjectStore("Peliculas",{
        autoIncrement: true
    });
});

idbRequest.addEventListener("success", ()=>{
    console.log("No hubo problemas al abrir la base de datos");
    leerObjetos();
});

idbRequest.addEventListener("error", ()=>{
    console.log("Hubo un error al abrir la base de datos");
});


const agregarObjeto = objeto => {
    const db = idbRequest.result;
    const idbTransaction = db.transaction("Peliculas", "readwrite");
    const almacenObjetos = idbTransaction.objectStore("Peliculas");
    almacenObjetos.add(objeto);
    idbTransaction.addEventListener("complete", ()=>{
        let bAdd = document.querySelector(".input>button");
        bAdd.setAttribute("class", "button-disabled");
        bAdd.disabled = true;
        leerObjetos();
        console.log("Objeto agregado correctamente.");
    });
}

const modificarObjeto = (objeto, clave) => {
    const db = idbRequest.result;
    const idbTransaction = db.transaction("Peliculas", "readwrite");
    const almacenObjetos = idbTransaction.objectStore("Peliculas");
    // En caso que put no encuentre el objeto lo crea
    almacenObjetos.put(objeto, clave);
    idbTransaction.addEventListener("complete", ()=>{
        console.log("Objeto modificado/agregado correctamente.");
    })
}

const eliminarObjeto = clave => {
    const db = idbRequest.result;
    const idbTransaction = db.transaction("Peliculas", "readwrite");
    const almacenObjetos = idbTransaction.objectStore("Peliculas");
    almacenObjetos.delete(clave);
    idbTransaction.addEventListener("complete", ()=>{
        console.log("Objeto eliminado correctamente.");
    })
}

document.querySelector(".input>button")
.addEventListener("click", ()=>{
    let titulo = document.querySelector(".input input").value;
    document.querySelector(".input input").value = "";
    agregarObjeto({titulo});
});

// ESTA FUNCION ES INTERESANTE PORQUE AL IR CREANDO ELEMENTOS SE PUEDEN CREAR ECENTOS DE LA MISMA
// AUN CUANDO ESTA RECIBA PARAMETROS Y PUEDE RESOLVERLAS DE MANERA RECURSIVA, ES DECIR LOS EVENTOS
// Y PARAMETROS DE ENTRADA SE GUARDAN PARA CADA ELEMENTO CREADO.
function elementoItem(key, titulo){
    let fragment = document.createDocumentFragment();
    let item = document.createElement("div");
    let resultado = document.createElement("h3");
    let botonGuardar = document.createElement("button");
    let botonEliminar = document.createElement("button");

    item.className = "item";
    resultado.className = "title-movie";
    resultado.contentEditable = "true";
    resultado.spellcheck = false;
    botonGuardar.className = "button-disabled";
    botonGuardar.disabled = true;

    resultado.textContent = titulo;
    botonGuardar.textContent = "Guardar";
    botonEliminar.textContent = "Eliminar";

    fragment.appendChild(item);
    item.appendChild(resultado);
    item.appendChild(botonGuardar);
    item.appendChild(botonEliminar);

    botonEliminar.addEventListener("click", ()=>{
        eliminarObjeto(key);
        leerObjetos();
    });
    // Evento al presionar cualquier tecla
    resultado.addEventListener("keyup", ()=>{
        if (resultado.textContent.toString() != "") {
            botonGuardar.setAttribute("class", "button-enabled");
            botonGuardar.disabled = false;
        } else {
            botonGuardar.setAttribute("class", "button-disabled");
            botonGuardar.disabled = true;
        }
    });
    // ESTE EVENTO ES MUY INTERESANTE YA QUE CUANDO NOS SALIMOS DEL FOCUS DEL TEXTO DETECTAMOS SI EL
    // SE MOVIO A SI AUN OBJETIVO EN ESPECIFICO, EN ESTE CASO UN BOTON Y LO COMPARAMOS CON UNA DE LAS
    // PROPIEDADES DEL EVENTO QUE CAPTURA EL ELEMENTO AL CUAL SE LE HIZO FOCUS AL SALIR CON e.relatedTarget
    // Y LO COMPARAMOS CON EL BOTON PARA SABER SI ES AHI DONDE MOVIMOS EL FOCO
    resultado.addEventListener("focusout", (e)=>{
        console.log(e);
        if (e.relatedTarget==botonGuardar) {
            console.log("le dimos")
        }else{
            if (confirm("Usted no ha guardado los cambios. ¿Desea hacerlo?")) {
                let titulo = resultado.textContent.toString();
                modificarObjeto({titulo}, key);
                botonGuardar.classList.replace("button-enabled", "button-disabled");
                botonGuardar.disabled = true;
                leerObjetos();
            } else {
                leerObjetos();
            }
        }
    });

    botonGuardar.addEventListener("click", ()=>{
        let titulo = resultado.textContent.toString();
        // TAMBIEN ES INTERESANTE QUE AL CREAR UN OBJETO CON UNA VARIABLE ESTA TOME COMO CLAVE EL NOMBRE
        // DE LA VARIABLE Y COMO VALOR EL VALOR DE LA VARIABLE
        modificarObjeto({titulo}, key);
        // ESTA PROPIEDAD classlist CON SU METODO replace MODIFICA TODAS LAS CLASES LLAMADAS COMO
        // EN EL PRIMER PARAMETRO Y LAS REEMPLAZA CON EL SEGUNDO PARAMETRO DE TODOS LOS ELEMENTOS
        // QUE CONTENGAN ESA CLASE Y ESE TIPO DE ELEMENTO SELECCIONADO
        botonGuardar.classList.replace("button-enabled", "button-disabled");
        botonGuardar.disabled = true;
        leerObjetos();
    });

    return fragment;
}

const leerObjetos = ()=> {
    const db = idbRequest.result;
    const idbTransaction = db.transaction("Peliculas", "readonly");
    const almacenObjetos = idbTransaction.objectStore("Peliculas");
    const puntero = almacenObjetos.openCursor();
    // LIMPIAMOS EL CONTENEDOR ANTES DE VOLVERLO A LLENAR PARA DATOS NO REPETIDOS
    document.querySelector(".output").innerHTML = "";
    puntero.addEventListener("success", ()=>{
        // INTERESANTE PERGUNTA SI EL PUNTERO NO ES NULO CONTINUAMOS ITERANDO GRACIAS AL EVENTO success
        // Y AL METODO puntero.result.continue();
        if (puntero.result) {
            // EN EL PUNTERO RESULT TRAEMOS LOS DATOS MAS IMPORTANTES
            console.log("key: " + puntero.result.key + " value: " + puntero.result.value.titulo);
            document.querySelector(".output").appendChild(
                elementoItem(puntero.result.key, puntero.result.value.titulo)
            )
            puntero.result.continue();
        } else console.log("Se terminó de leer los datos.");
    })
}

document.getElementById("input-text")
.addEventListener("keyup", ()=>{
    let bAdd = document.querySelector(".input>button");
    if (document.getElementById("input-text").value != "") {
        bAdd.setAttribute("class", "button-enabled");
        bAdd.disabled = false;
    } else {
        bAdd.setAttribute("class", "button-disabled");
        bAdd.disabled = true;
    }
});