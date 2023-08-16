class Transaccion {
    constructor(descripcion, tipo, cantidad) {
        this.fecha = new Date().toISOString().split('T')[0]; // Formato "yyyy-MM-dd"
        this.descripcion = descripcion;
        this.tipo = tipo;
        this.cantidad = cantidad;
    }
}

class UI {
    static mostrarTransacciones() {
        const transacciones = Almacenamiento.obtenerTransacciones();
        transacciones.forEach((transaccion) => UI.agregarTransaccionLista(transaccion));
    }

    static agregarTransaccionLista(transaccion) {
        const lista = document.getElementById('listaTransacciones');
        const color = transaccion.tipo === 'ingreso' ? 'text-success' : 'text-danger';

        const item = document.createElement('li');
        item.innerHTML = `
            <span class="${color}">${transaccion.descripcion} - Q${transaccion.cantidad.toFixed(2)}</span> 
            <button class="btn btn-danger btn-sm delete">X</button>
        `;
        lista.appendChild(item);
    }

    static eliminarTransaccion(el) {
        if (el.classList.contains('delete')) {
            el.parentElement.remove();
        }
    }

    static borrarTodoDeLista() {
        const lista = document.getElementById('listaTransacciones');
        while (lista.firstChild) {
            lista.removeChild(lista.firstChild);
        }
    }

    static limpiarCampos() {
        document.getElementById('descripcion').value = '';
        document.getElementById('cantidad').value = '';
    }

    static llenarTabla(desde, hasta) {
        const tablaTransacciones = document.getElementById('tablaTransacciones');
        const transacciones = Almacenamiento.obtenerTransacciones();

        let transaccionesFiltradas = transacciones;
        if (desde && hasta) {
            transaccionesFiltradas = _.filter(transacciones, t => new Date(t.fecha) >= new Date(desde) && new Date(t.fecha) <= new Date(hasta));
        }

        tablaTransacciones.innerHTML = '';
        transaccionesFiltradas.forEach(transaccion => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${transaccion.fecha}</td>
                <td>${transaccion.descripcion}</td>
                <td>${transaccion.tipo}</td>
                <td>Q${transaccion.cantidad.toFixed(2)}</td>
            `;
            tablaTransacciones.appendChild(fila);
        });
    }
}

class Almacenamiento {
    static obtenerTransacciones() {
        return JSON.parse(localStorage.getItem('transacciones')) || [];
    }

    static agregarTransaccion(transaccion) {
        const transacciones = Almacenamiento.obtenerTransacciones();
        transacciones.push(transaccion);
        localStorage.setItem('transacciones', JSON.stringify(transacciones));
    }

    static borrarTodo() {
        localStorage.removeItem('transacciones');
    }

    static removerTransaccion(descripcion) {
        let transacciones = Almacenamiento.obtenerTransacciones();
        transacciones = _.remove(transacciones, t => t.descripcion !== descripcion);
        localStorage.setItem('transacciones', JSON.stringify(transacciones));
    }
}

function actualizarGrafico() {
    if(window.miGrafico) {
        window.miGrafico.destroy(); // Destruimos el gráfico anterior para evitar superposiciones
    }
    const transacciones = Almacenamiento.obtenerTransacciones();
    const ingresos = _.filter(transacciones, { 'tipo': 'ingreso' });
    const gastos = _.filter(transacciones, { 'tipo': 'gasto' });

    const etiquetas = ['Ingresos', 'Gastos'];
    const datos = [_.sumBy(ingresos, 'cantidad'), _.sumBy(gastos, 'cantidad')];

    const contexto = document.getElementById('graficoFinanzas').getContext('2d');

    window.miGrafico = new Chart(contexto, {
        type: 'doughnut',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Finanzas Personales',
                data: datos,
                backgroundColor: ['rgba(0, 255, 0, 0.6)', 'rgba(255, 0, 0, 0.6)'],
            }]
        }
    });
}

document.addEventListener('DOMContentLoaded', UI.mostrarTransacciones);
document.addEventListener('DOMContentLoaded', UI.llenarTabla);
document.addEventListener('DOMContentLoaded', actualizarGrafico);

document.getElementById('formularioTransaccion').addEventListener('submit', (e) => {
    e.preventDefault();

    const descripcion = document.getElementById('descripcion').value;
    const tipo = document.getElementById('tipo').value;
    const cantidad = parseFloat(document.getElementById('cantidad').value);

    const transaccion = new Transaccion(descripcion, tipo, cantidad);

    UI.agregarTransaccionLista(transaccion);
    Almacenamiento.agregarTransaccion(transaccion);
    UI.limpiarCampos();
    UI.llenarTabla();
    actualizarGrafico();
});

document.getElementById('listaTransacciones').addEventListener('click', (e) => {
    const descripcion = e.target.parentElement.textContent.split('-')[0].trim();
    UI.eliminarTransaccion(e.target);
    Almacenamiento.removerTransaccion(descripcion);
    UI.llenarTabla();
    actualizarGrafico();
});

document.getElementById('btnFiltrar').addEventListener('click', () => {
    const desde = document.getElementById('fechaDesde').value;
    const hasta = document.getElementById('fechaHasta').value;

    UI.llenarTabla(desde, hasta);
});

document.getElementById('btnBorrarTodo').addEventListener('click', () => {
    Almacenamiento.borrarTodo();
    UI.borrarTodoDeLista();
    UI.mostrarTransacciones();  // Para actualizar la lista mostrada
    UI.llenarTabla();           // Para actualizar la tabla
    actualizarGrafico();       // Para actualizar el gráfico
});

