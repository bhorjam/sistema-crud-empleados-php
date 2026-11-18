"use strict";

const estado = { pagina: 1, porPagina: 10, busqueda: "", tokenCsrf: "", empleados: [] };
const formulario = document.querySelector("#empleado-form");
const campos = ["nombre", "tipo_documento", "numero_documento", "edad", "telefono", "cargo"];
const lista = document.querySelector("#empleados-lista");
const alerta = document.querySelector("#alerta");
let temporizadorBusqueda;

const escapar = (valor) => String(valor ?? "").replace(/[&<>'"]/g, (caracter) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[caracter]));

function mostrarAlerta(mensaje, tipo = "success") {
  alerta.textContent = mensaje;
  alerta.className = `alert alert-${tipo} alert-dismissible fade show py-2 mb-3`;
  window.clearTimeout(mostrarAlerta.temporizador);
  mostrarAlerta.temporizador = window.setTimeout(() => alerta.classList.add("d-none"), 4500);
}

function limpiarErrores() {
  formulario.classList.remove("was-validated");
  formulario.querySelectorAll(".is-invalid").forEach((elemento) => elemento.classList.remove("is-invalid"));
  formulario.querySelectorAll(".invalid-feedback").forEach((elemento) => { elemento.textContent = ""; });
}

function mostrarErrores(errores = {}) {
  Object.entries(errores).forEach(([campo, mensaje]) => {
    if (campo === "sexo") {
      document.querySelectorAll('input[name="sexo"]').forEach((input) => input.classList.add("is-invalid"));
      document.querySelector(".sexo-feedback").textContent = mensaje;
      return;
    }
    const input = document.querySelector(`#${campo}`);
    if (input) {
      input.classList.add("is-invalid");
      input.parentElement.querySelector(".invalid-feedback").textContent = mensaje;
    }
  });
}

function datosFormulario() {
  return {
    nombre: document.querySelector("#nombre").value.trim(),
    tipo_documento: document.querySelector("#tipo_documento").value,
    numero_documento: document.querySelector("#numero_documento").value.trim(),
    edad: document.querySelector("#edad").value,
    sexo: document.querySelector('input[name="sexo"]:checked')?.value || "",
    telefono: document.querySelector("#telefono").value.trim(),
    cargo: document.querySelector("#cargo").value.trim(),
  };
}

function actualizarFormatoDocumento() {
  const numero = document.querySelector("#numero_documento");
  const esDni = document.querySelector("#tipo_documento").value === "DNI";
  numero.maxLength = esDni ? 8 : 20;
  numero.inputMode = esDni ? "numeric" : "text";
  numero.pattern = esDni ? "[0-9]{8}" : "[A-Za-z0-9-]{6,20}";
  numero.placeholder = esDni ? "8 dígitos" : "6 a 20 letras o números";
}

async function solicitar(url, opciones = {}) {
  const respuesta = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/json", ...opciones.headers },
    ...opciones,
  });
  const cuerpo = await respuesta.json().catch(() => ({ ok: false, mensaje: "Respuesta no válida del servidor." }));
  if (!respuesta.ok) throw cuerpo;
  return cuerpo;
}

function renderizarEmpleados(datos) {
  estado.empleados = datos.empleados;
  document.querySelector("#total-empleados").textContent = datos.total;
  const inicio = datos.total ? ((datos.pagina - 1) * datos.por_pagina) + 1 : 0;
  const fin = Math.min(datos.pagina * datos.por_pagina, datos.total);
  document.querySelector("#rango-registros").textContent = datos.total ? `Mostrando registros del ${inicio} al ${fin} de un total de ${datos.total}` : "No hay empleados registrados";
  lista.innerHTML = datos.empleados.length
    ? datos.empleados.map((empleado, indice) => `
      <tr>
        <td class="text-secondary">${inicio + indice}</td>
        <td class="fw-medium">${escapar(empleado.nombre)}</td>
        <td>${empleado.edad}</td>
        <td><span class="badge text-bg-light border">${escapar(empleado.tipo_documento)}</span> ${escapar(empleado.numero_documento)}</td>
        <td>${escapar(empleado.cargo)}</td>
        <td class="text-end text-nowrap">
          <button class="btn btn-warning btn-action" type="button" data-accion="editar" data-id="${empleado.id}" title="Editar ${escapar(empleado.nombre)}"><i class="bi bi-pencil-square"></i><span class="visually-hidden">Editar</span></button>
          <button class="btn btn-danger btn-action" type="button" data-accion="eliminar" data-id="${empleado.id}" title="Eliminar ${escapar(empleado.nombre)}"><i class="bi bi-trash3"></i><span class="visually-hidden">Eliminar</span></button>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="6" class="empty-state"><i class="bi bi-people d-block mb-2"></i>No se encontraron empleados.</td></tr>';
  renderizarPaginacion(datos.pagina, Math.ceil(datos.total / datos.por_pagina));
}

function renderizarPaginacion(actual, total) {
  const paginacion = document.querySelector("#paginacion");
  if (total <= 1) { paginacion.innerHTML = ""; return; }
  const boton = (texto, pagina, deshabilitado = false, activo = false) => `<li class="page-item ${deshabilitado ? "disabled" : ""} ${activo ? "active" : ""}"><button class="page-link" type="button" data-pagina="${pagina}" ${deshabilitado ? "disabled" : ""}>${texto}</button></li>`;
  const elipsis = '<li class="page-item disabled"><span class="page-link">…</span></li>';
  const inicio = Math.max(1, actual - 2);
  const fin = Math.min(total, actual + 2);
  const paginas = Array.from({ length: fin - inicio + 1 }, (_, indice) => {
    const pagina = inicio + indice;
    return boton(pagina, pagina, false, actual === pagina);
  }).join("");
  paginacion.innerHTML = boton("Primero", 1, actual === 1)
    + boton("Anterior", actual - 1, actual === 1)
    + (inicio > 1 ? elipsis : "") + paginas + (fin < total ? elipsis : "")
    + boton("Siguiente", actual + 1, actual === total) + boton("Último", total, actual === total);
}

async function cargarEmpleados() {
  lista.innerHTML = '<tr><td colspan="6" class="empty-state"><span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Cargando empleados…</td></tr>';
  try {
    const parametros = new URLSearchParams({ pagina: estado.pagina, por_pagina: estado.porPagina, buscar: estado.busqueda });
    const datos = await solicitar(`api.php?${parametros}`);
    estado.tokenCsrf = datos.csrf_token;
    renderizarEmpleados(datos);
  } catch (error) {
    lista.innerHTML = '<tr><td colspan="6" class="empty-state text-danger">No se pudo cargar la lista. Verifica MySQL e importa <code>db/database.sql</code>.</td></tr>';
    mostrarAlerta(error.mensaje || "No se pudo conectar con el servidor.", "danger");
  }
}

function cancelarEdicion() {
  formulario.reset();
  actualizarFormatoDocumento();
  document.querySelector("#empleado-id").value = "";
  document.querySelector("#guardar-btn").innerHTML = '<i class="bi bi-plus-lg me-1"></i>Agregar empleado';
  document.querySelector("#cancelar-btn").classList.add("d-none");
  limpiarErrores();
}

function iniciarEdicion(id) {
  const empleado = estado.empleados.find((item) => Number(item.id) === Number(id));
  if (!empleado) return;
  campos.forEach((campo) => { document.querySelector(`#${campo}`).value = empleado[campo]; });
  actualizarFormatoDocumento();
  document.querySelector(`#sexo-${empleado.sexo.toLowerCase()}`).checked = true;
  document.querySelector("#empleado-id").value = empleado.id;
  document.querySelector("#guardar-btn").innerHTML = '<i class="bi bi-check-lg me-1"></i>Guardar cambios';
  document.querySelector("#cancelar-btn").classList.remove("d-none");
  limpiarErrores();
  document.querySelector("#nombre").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limpiarErrores();
  if (!formulario.checkValidity()) { formulario.classList.add("was-validated"); return; }
  const id = document.querySelector("#empleado-id").value;
  const boton = document.querySelector("#guardar-btn");
  boton.disabled = true;
  try {
    const datos = await solicitar(id ? `api.php?id=${encodeURIComponent(id)}` : "api.php", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": estado.tokenCsrf },
      body: JSON.stringify(datosFormulario()),
    });
    mostrarAlerta(datos.mensaje);
    cancelarEdicion();
    estado.pagina = 1;
    await cargarEmpleados();
  } catch (error) {
    mostrarErrores(error.errores);
    const primerError = Object.values(error.errores || {})[0];
    mostrarAlerta(primerError || error.mensaje || "No se pudo guardar el empleado.", "danger");
  } finally { boton.disabled = false; }
});

lista.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;
  const { accion, id } = boton.dataset;
  if (accion === "editar") { iniciarEdicion(id); return; }
  const empleado = estado.empleados.find((item) => Number(item.id) === Number(id));
  if (!window.confirm(`¿Eliminar a ${empleado?.nombre || "este empleado"}? Esta acción no se puede deshacer.`)) return;
  boton.disabled = true;
  try {
    const datos = await solicitar(`api.php?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { "X-CSRF-Token": estado.tokenCsrf } });
    mostrarAlerta(datos.mensaje);
    if (estado.empleados.length === 1 && estado.pagina > 1) estado.pagina--;
    await cargarEmpleados();
  } catch (error) { mostrarAlerta(error.mensaje || "No se pudo eliminar el empleado.", "danger"); }
});

document.querySelector("#cancelar-btn").addEventListener("click", cancelarEdicion);
document.querySelector("#recargar-btn").addEventListener("click", cargarEmpleados);
document.querySelector("#tipo_documento").addEventListener("change", () => {
  const numero = document.querySelector("#numero_documento");
  actualizarFormatoDocumento();
  numero.value = "";
  numero.classList.remove("is-invalid");
});
document.querySelector("#telefono").addEventListener("input", (evento) => {
  evento.target.value = evento.target.value.replace(/\D/g, "").slice(0, 9);
  evento.target.classList.remove("is-invalid");
});
document.querySelector("#por-pagina").addEventListener("change", (evento) => { estado.porPagina = Number(evento.target.value); estado.pagina = 1; cargarEmpleados(); });
document.querySelector("#buscar").addEventListener("input", (evento) => {
  window.clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = window.setTimeout(() => { estado.busqueda = evento.target.value.trim(); estado.pagina = 1; cargarEmpleados(); }, 300);
});
document.querySelector("#paginacion").addEventListener("click", (evento) => { const pagina = evento.target.dataset.pagina; if (pagina) { estado.pagina = Number(pagina); cargarEmpleados(); } });
document.querySelectorAll("input, select").forEach((campo) => campo.addEventListener("input", () => { campo.classList.remove("is-invalid"); }));

actualizarFormatoDocumento();
cargarEmpleados();
