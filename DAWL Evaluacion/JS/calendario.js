//Verifica si hay datos guardados en localStorage, si no, inicializa con arreglos vacíos
let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let prestamos = JSON.parse(localStorage.getItem("prestamos")) || [];

//Al cargar la página, se muestran los clientes en el select y los préstamos en la tabla
window.onload = function () {
    cargarClientes();
    mostrarPrestamos();
};

//Registro de un nuevo cliente al enviar el formulario
document.getElementById("clienteForm").addEventListener("submit", function (e) {
    e.preventDefault(); //Evita que la página se recargue al enviar el formulario

    //Captura de los valores del formulario
    let nombre = document.getElementById("nombre").value;
    let dui = document.getElementById("dui").value;
    let telefono = document.getElementById("telefono").value;
    let correo = document.getElementById("correo").value;

    //Crea un nuevo objeto cliente con sus datos y un arreglo vacío de préstamos
    let nuevoCliente = {
        nombre: nombre,
        dui: dui,
        telefono: telefono,
        correo: correo,
        prestamos: []
    };

    //Agrega el nuevo cliente al arreglo y guarda en localStorage
    clientes.push(nuevoCliente);
    localStorage.setItem("clientes", JSON.stringify(clientes));

    cargarClientes(); //Recarga el select de clientes
    alert("Cliente registrado");
    this.reset(); //Limpia el formulario
});

//Llena el select con la lista de clientes disponibles
function cargarClientes() {
    let select = document.getElementById("clienteSelect");
    select.innerHTML = "<option value=''>Seleccione un cliente</option>";

    clientes.forEach((c, i) => {
        let op = document.createElement("option");
        op.value = i; //El valor es el índice del cliente en el arreglo
        op.textContent = c.nombre;
        select.appendChild(op);
    });
}

//Registro de un préstamo para un cliente seleccionado
document.getElementById("prestamoForm").addEventListener("submit", function (e) {
    e.preventDefault();

    let indice = document.getElementById("clienteSelect").value;
    if (indice === "") return alert("Seleccione un cliente");

    let cliente = clientes[indice];

    //Verifica si el cliente ya tiene un préstamo activo
    if (cliente.prestamos.some(p => p.estado === "Activo")) {
        return alert("Este cliente ya tiene un préstamo activo");
    }

    //Captura de datos del formulario
    let monto = parseFloat(document.getElementById("monto").value);
    let fechaInicio = new Date(document.getElementById("fechaInicio").value);

    //Cálculo del interés y total a pagar
    let interes = monto * 0.03;
    let total = monto + interes;

    //Cálculo de la fecha de vencimiento (20 días hábiles después de la fecha de inicio)
    let vencimiento = calcularDiasHabiles(fechaInicio, 20);

    //Crea un objeto préstamo con sus datos
    let nuevoPrestamo = {
        cliente: cliente.nombre,
        monto: monto,
        interes: interes,
        total: total,
        fechaVencimiento: vencimiento,
        estado: "Activo"
    };

    //Asocia el préstamo al cliente y lo agrega al listado general
    cliente.prestamos.push(nuevoPrestamo);
    prestamos.push(nuevoPrestamo);

    //Guarda la información actualizada en localStorage
    localStorage.setItem("clientes", JSON.stringify(clientes));
    localStorage.setItem("prestamos", JSON.stringify(prestamos));

    mostrarPrestamos(); // Actualiza la tabla de préstamos
    alert("Préstamo registrado");
    this.reset(); //Limpia el formulario
});

//Función para calcular fecha sumando días hábiles (sin contar fines de semana)
function calcularDiasHabiles(fecha, diasHabiles) {
    let count = 0;
    let nuevaFecha = new Date(fecha);

    while (count < diasHabiles) {
        nuevaFecha.setDate(nuevaFecha.getDate() + 1);
        let dia = nuevaFecha.getDay();

        //Días de la semana lunes a viernes
        if (dia >= 1 && dia <= 5) {
            count++;
        }
        //Si es sábado (6) o domingo (0), se salta automáticamente en el próximo ciclo
    }

    //Devuelve la fecha en formato "YYYY-MM-DD"
    return nuevaFecha.toISOString().split("T")[0];
}

//Muestra todos los préstamos en la tabla HTML
function mostrarPrestamos() {
    let tabla = document.getElementById("tablaPrestamos");
    tabla.innerHTML = "";

    prestamos.forEach((p, i) => {
        let hoy = new Date();
        let vencimiento = new Date(p.fechaVencimiento);

        // Calcula los días restantes hasta el vencimiento
        let diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

        // Alerta si quedan exactamente 2 días antes del vencimiento
        if (diasRestantes === 2 && p.estado === "Activo") {
            alert(`El préstamo de ${p.cliente} vence en 2 días.`);
        }

        //Determina la clase CSS según el estado del préstamo
        let alerta = (diasRestantes <= 2 && p.estado === "Activo") ? 'class="alerta"' : "";
        if (diasRestantes < 0) {
            alerta = 'class="vencido"';
            p.estado = "Vencido"; // Marca el préstamo como vencido si ya pasó la fecha
        }

        //Genera la fila de la tabla con los datos del préstamo
        let fila = `
            <tr ${alerta}>
                <td>${p.cliente}</td>
                <td>$${p.monto.toFixed(2)}</td>
                <td>$${p.interes.toFixed(2)}</td>
                <td>$${p.total.toFixed(2)}</td>
                <td>${p.fechaVencimiento}</td>
                <td>${p.estado}</td>
                <td>${p.estado === "Activo" ? `<button onclick="pagar(${i})">Pagar</button>` : ""}</td>
            </tr>
        `;
        tabla.innerHTML += fila;
    });
}

//Función que marca un préstamo como pagado
function pagar(index) {
    //Cambia el estado en la lista general
    prestamos[index].estado = "Cancelado";

    //Busca el cliente correspondiente por nombre
    let nombreCliente = prestamos[index].cliente;
    let cliente = clientes.find(c => c.nombre === nombreCliente);

    //Busca el préstamo específico del cliente (por fecha de vencimiento)
    let prestamoCliente = cliente.prestamos.find(p => p.fechaVencimiento === prestamos[index].fechaVencimiento);
    prestamoCliente.estado = "Cancelado";

    //Actualiza el localStorage con el cambio de estado
    localStorage.setItem("clientes", JSON.stringify(clientes));
    localStorage.setItem("prestamos", JSON.stringify(prestamos));

    mostrarPrestamos(); //Refresca la tabla
    alert("Préstamo pagado");
}

//Filtra los préstamos por fecha de vencimiento ingresada
function filtrarPrestamos() {
    let fecha = document.getElementById("filtrarFecha").value;
    if (fecha === "") return mostrarPrestamos(); //Si no hay fecha, muestra todos

    let tabla = document.getElementById("tablaPrestamos");
    tabla.innerHTML = "";

    prestamos.forEach((p, i) => {
        if (p.fechaVencimiento === fecha) {
            let fila = `
                <tr>
                    <td>${p.cliente}</td>
                    <td>$${p.monto.toFixed(2)}</td>
                    <td>$${p.interes.toFixed(2)}</td>
                    <td>$${p.total.toFixed(2)}</td>
                    <td>${p.fechaVencimiento}</td>
                    <td>${p.estado}</td>
                    <td>${p.estado === "Activo" ? `<button onclick="pagar(${i})">Pagar</button>` : ""}</td>
                </tr>
            `;
            tabla.innerHTML += fila;
        }
    });
}
