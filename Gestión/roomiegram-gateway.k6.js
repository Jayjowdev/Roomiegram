import http from "k6/http";
import { check, group, sleep } from "k6";
import exec from "k6/execution";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

const jsonHeaders = {
  "Content-Type": "application/json",
};

export const options = {
  discardResponseBodies: true,
  scenarios: {
    browsing: {
      executor: "constant-arrival-rate",
      exec: "browsingScenario",
      rate: 20,
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 10,
      maxVUs: 40,
    },
    login: {
      executor: "constant-arrival-rate",
      exec: "loginScenario",
      rate: 3,
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 3,
      maxVUs: 10,
    },
    user_flow: {
      executor: "per-vu-iterations",
      exec: "userFlowScenario",
      vus: 2,
      iterations: 8,
      startTime: "10s",
      maxDuration: "2m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],

    "http_req_duration{endpoint:login}": ["p(95)<1200"],
    "http_req_duration{endpoint:publicaciones_listar}": ["p(95)<700"],
    "http_req_duration{endpoint:hogares_listar}": ["p(95)<700"],
    "http_req_duration{endpoint:tareas_listar}": ["p(95)<700"],
    "http_req_duration{endpoint:publicacion_crear}": ["p(95)<1500"],
    "http_req_duration{endpoint:hogar_crear}": ["p(95)<1500"],
    "http_req_duration{endpoint:hogar_asociar_publicacion}": ["p(95)<1500"],
  },
};

function login(username, password) {
  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      usuario: username,
      contrasena: password,
    }),
    {
      headers: jsonHeaders,
      tags: { endpoint: "login" },
      responseType: "text",
    },
  );

  check(response, {
    "login 200": (r) => r.status === 200,
    "login retorna id": (r) => {
      if (r.status !== 200) return false;
      const body = JSON.parse(r.body);
      return typeof body.id === "number";
    },
  });

  if (response.status !== 200) {
    throw new Error(`Login falló: ${response.status} ${response.body}`);
  }

  return JSON.parse(response.body);
}

export function setup() {
  const admin = login(
    __ENV.ADMIN_USER || "admin",
    __ENV.ADMIN_PASSWORD || "admin123",
  );

  const cliente = login(
    __ENV.TEST_USER || "juanperez",
    __ENV.TEST_PASSWORD || "password123",
  );

  return { admin, cliente };
}

export function browsingScenario() {
  group("browsing", () => {
    const responses = http.batch([
      [
        "GET",
        `${BASE_URL}/publicaciones/listar`,
        null,
        { tags: { endpoint: "publicaciones_listar" } },
      ],
      [
        "GET",
        `${BASE_URL}/hogares`,
        null,
        { tags: { endpoint: "hogares_listar" } },
      ],
      [
        "GET",
        `${BASE_URL}/tareas/listar`,
        null,
        { tags: { endpoint: "tareas_listar" } },
      ],
      [
        "GET",
        `${BASE_URL}/hogar-cuentas`,
        null,
        { tags: { endpoint: "hogar_cuentas_listar" } },
      ],
      [
        "GET",
        `${BASE_URL}/notificaciones`,
        null,
        { tags: { endpoint: "notificaciones_listar" } },
      ],
      [
        "GET",
        `${BASE_URL}/comprobantes`,
        null,
        { tags: { endpoint: "comprobantes_listar" } },
      ],
    ]);

    check(responses[0], { "publicaciones 200": (r) => r.status === 200 });
    check(responses[1], { "hogares 200": (r) => r.status === 200 });
    check(responses[2], { "tareas 200": (r) => r.status === 200 });
    check(responses[3], { "hogar-cuentas 200": (r) => r.status === 200 });
    check(responses[4], { "notificaciones 200": (r) => r.status === 200 });
    check(responses[5], { "comprobantes 200": (r) => r.status === 200 });
  });

  sleep(Math.random() * 0.5);
}

export function loginScenario() {
  login(
    __ENV.TEST_USER || "juanperez",
    __ENV.TEST_PASSWORD || "password123",
  );

  sleep(Math.random() * 0.3);
}

export function userFlowScenario(data) {
  const suffix = `${exec.vu.idInTest}-${exec.scenario.iterationInTest}-${Date.now()}`;

  const publicacionPayload = {
    usuarioCreador: data.admin.usuario,
    titulo: `k6-publicacion-${suffix}`,
    ubicacion: "Santiago Centro",
    descripcion: "Publicacion temporal creada por k6 via gateway",
    precio: 280000,
    numeroHabitaciones: 1,
    numeroPersonas: 1,
    numeroBanos: 1,
  };

  const publicacionResponse = http.post(
    `${BASE_URL}/publicaciones/guardar`,
    JSON.stringify(publicacionPayload),
    {
      headers: jsonHeaders,
      tags: { endpoint: "publicacion_crear" },
      responseType: "text",
    },
  );

  check(publicacionResponse, {
    "crear publicacion 201": (r) => r.status === 201,
  });

  if (publicacionResponse.status !== 201) {
    return;
  }

  const publicacion = JSON.parse(publicacionResponse.body);

  const hogarPayload = {
    nombre: `k6-hogar-${suffix}`,
    descripcion: "Hogar temporal para prueba de flujo",
    usuarioCreadorId: data.admin.id,
  };

  const hogarResponse = http.post(
    `${BASE_URL}/hogares`,
    JSON.stringify(hogarPayload),
    {
      headers: jsonHeaders,
      tags: { endpoint: "hogar_crear" },
      responseType: "text",
    },
  );

  check(hogarResponse, {
    "crear hogar 201": (r) => r.status === 201,
  });

  if (hogarResponse.status !== 201) {
    cleanupPublicacion(publicacion.id, data.admin);
    return;
  }

  const hogar = JSON.parse(hogarResponse.body);

  const asociarResponse = http.post(
    `${BASE_URL}/hogares/${hogar.id}/publicaciones`,
    JSON.stringify({
      administradorId: data.admin.id,
      recursoId: publicacion.id,
    }),
    {
      headers: jsonHeaders,
      tags: { endpoint: "hogar_asociar_publicacion" },
    },
  );

  check(asociarResponse, {
    "asociar publicacion a hogar 200": (r) => r.status === 200,
  });

  cleanupHogar(hogar.id, data.admin.id);
  cleanupPublicacion(publicacion.id, data.admin);

  sleep(1);
}

function cleanupHogar(hogarId, adminId) {
  http.del(`${BASE_URL}/hogares/${hogarId}?administradorId=${adminId}`, null, {
    tags: { endpoint: "hogar_delete" },
  });
}

function cleanupPublicacion(publicacionId, admin) {
  http.del(
    `${BASE_URL}/publicaciones/${publicacionId}?usuarioSolicitante=${encodeURIComponent(admin.usuario)}&rolSolicitante=${encodeURIComponent(admin.role)}`,
    null,
    {
      tags: { endpoint: "publicacion_delete" },
    },
  );
}