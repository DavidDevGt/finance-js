document.getElementById("btnExportarImagen").addEventListener("click", () => {
  html2canvas(document.querySelector(".table")).then(canvas => {
      let imgData = canvas.toDataURL('image/jpeg');
      let a = document.createElement('a');
      a.href = imgData;
      a.download = 'tabla_finanzas.jpg';
      a.click();
  });
});


/* La clase Transaccion es una clase de JavaScript que representa una transacción con propiedades como
descripción, tipo y cantidad. */
class Transaccion {
  constructor(descripcion, tipo, cantidad) {
    this.fecha = new Date().toISOString().split("T")[0]; // Formato gringo para la fecha
    this.descripcion = descripcion;
    this.tipo = tipo;
    this.cantidad = cantidad;
  }
}

/* La clase UI en JavaScript proporciona métodos para mostrar y manipular transacciones en una interfaz
de usuario. */
class UI {
  static mostrarTransacciones() {
    const transacciones = Almacenamiento.obtenerTransacciones();
    transacciones.forEach((transaccion) =>
      UI.agregarTransaccionLista(transaccion)
    );
  }

  static agregarTransaccionLista(transaccion) {
    const lista = document.getElementById("listaTransacciones");
    const color =
      transaccion.tipo === "ingreso" ? "text-success" : "text-danger";

    const item = document.createElement("li");
    item.innerHTML = `
            <span class="${color} item-text">${
      transaccion.descripcion
    } - Q${transaccion.cantidad.toFixed(2)}</span> 
            <button class="btn btn-delete btn-danger btn-sm delete">X</button>
        `;
    lista.appendChild(item);
  }

  static eliminarTransaccion(el) {
    if (el.classList.contains("delete")) {
      el.parentElement.remove();
    }
  }

  static borrarTodoDeLista() {
    const lista = document.getElementById("listaTransacciones");
    while (lista.firstChild) {
      lista.removeChild(lista.firstChild);
    }
  }

  static limpiarCampos() {
    document.getElementById("descripcion").value = "";
    document.getElementById("cantidad").value = "";
  }

  static actualizarBalanceEnTabla() {
    const transacciones = Almacenamiento.obtenerTransacciones();
    let totalIngresos = 0;
    let totalGastos = 0;

    transacciones.forEach((transaccion) => {
      if (transaccion.tipo === "ingreso") {
        totalIngresos += transaccion.cantidad;
      } else {
        totalGastos -= transaccion.cantidad; // restar el gasto
      }
    });

    let balance = totalIngresos + totalGastos;
    const filaBalance = document.createElement("tr");

    let balanceClase = balance > 0 ? "balance-positivo" : "balance-negativo";

    filaBalance.innerHTML = `
            <td colspan="2"></td>
            <td class="${balanceClase}"><b>Balance</b></td>
            <td class="${balanceClase}">Q${balance.toFixed(2)}</td>
        `;
    tablaTransacciones.appendChild(filaBalance);
  }

  static llenarTabla(desde, hasta) {
    const tablaTransacciones = document.getElementById("tablaTransacciones");
    const transacciones = Almacenamiento.obtenerTransacciones();

    let transaccionesFiltradas = transacciones;
    if (desde && hasta) {
      transaccionesFiltradas = _.filter(
        transacciones,
        (t) =>
          new Date(t.fecha) >= new Date(desde) &&
          new Date(t.fecha) <= new Date(hasta)
      );
    }

    tablaTransacciones.innerHTML = "";
    transaccionesFiltradas.forEach((transaccion) => {
      const fila = document.createElement("tr");

      let tipoClase = transaccion.tipo === "ingreso" ? "ingreso" : "gasto";

      fila.innerHTML = `
            <td>${transaccion.fecha}</td>
            <td>${transaccion.descripcion}</td>
            <td class="${tipoClase}">${transaccion.tipo}</td>
            <td class="${tipoClase}">Q${transaccion.cantidad.toFixed(2)}</td>
        `;
      tablaTransacciones.appendChild(fila);
    });

    UI.actualizarBalanceEnTabla(); // Llamar a la función después de llenar la tabla
  }
}

/* La clase Almacenamiento proporciona métodos para almacenar y recuperar transacciones en el
almacenamiento local. */
class Almacenamiento {
  static obtenerTransacciones() {
    return JSON.parse(localStorage.getItem("transacciones")) || [];
  }

  static agregarTransaccion(transaccion) {
    const transacciones = Almacenamiento.obtenerTransacciones();
    transacciones.push(transaccion);
    localStorage.setItem("transacciones", JSON.stringify(transacciones));
  }

  static borrarTodo() {
    localStorage.removeItem("transacciones");
  }

  static removerTransaccion(descripcion) {
    let transacciones = Almacenamiento.obtenerTransacciones();
    transacciones = _.remove(
      transacciones,
      (t) => t.descripcion !== descripcion
    );
    localStorage.setItem("transacciones", JSON.stringify(transacciones));
  }
}

function actualizarGrafico() {
  if (window.miGrafico) {
    window.miGrafico.destroy(); // borra el gráfico pasado
  }

  const transacciones = Almacenamiento.obtenerTransacciones();
  const ingresos = _.filter(transacciones, { tipo: "ingreso" });
  const gastos = _.filter(transacciones, { tipo: "gasto" });

  const totalIngresos = _.sumBy(ingresos, "cantidad");
  const totalGastos = _.sumBy(gastos, "cantidad");

  const etiquetas = ["Ingresos", "Gastos"];
  const datos = [totalIngresos, totalGastos];

  const contexto = document.getElementById("graficoFinanzas").getContext("2d");

  window.miGrafico = new Chart(contexto, {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: "Finanzas Personales",
          data: datos,
          backgroundColor: ["#4CAF50", "#FF5733"],
          hoverBackgroundColor: ["#45A049", "#FF4136"],
        },
      ],
    },
    options: {
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            let label = data.labels[tooltipItem.index] || "";
            let value =
              data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
            label += `: $${value.toFixed(2)}`;
            return label;
          },
        },
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  UI.mostrarTransacciones();
  UI.llenarTabla();
  actualizarGrafico();
});

document
  .getElementById("formularioTransaccion")
  .addEventListener("submit", (e) => {
    e.preventDefault();

    const descripcion = document.getElementById("descripcion").value;
    const tipo = document.getElementById("tipo").value;
    const cantidad = parseFloat(document.getElementById("cantidad").value);

    const transaccion = new Transaccion(descripcion, tipo, cantidad);

    UI.agregarTransaccionLista(transaccion);
    Almacenamiento.agregarTransaccion(transaccion);
    UI.limpiarCampos();
    UI.llenarTabla();
    actualizarGrafico();
  });

document.getElementById("listaTransacciones").addEventListener("click", (e) => {
  const descripcion = e.target.parentElement.textContent.split("-")[0].trim();
  UI.eliminarTransaccion(e.target);
  Almacenamiento.removerTransaccion(descripcion);
  UI.llenarTabla();
  actualizarGrafico();
});

document.getElementById("btnFiltrar").addEventListener("click", () => {
  const desde = document.getElementById("fechaDesde").value;
  const hasta = document.getElementById("fechaHasta").value;

  UI.llenarTabla(desde, hasta);
});

document.getElementById("btnBorrarTodo").addEventListener("click", () => {
  Almacenamiento.borrarTodo();
  UI.borrarTodoDeLista();
  UI.mostrarTransacciones();
  UI.llenarTabla();
  actualizarGrafico();
});
