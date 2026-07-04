package com.roomiegram.usuario.service;

import com.roomiegram.usuario.DTO.TaskAssignmentEmailRequest;
import com.roomiegram.usuario.DTO.TaskCompletedEmailRequest;
import com.roomiegram.usuario.DTO.RequestReceivedEmailRequest;
import com.roomiegram.usuario.DTO.RequestResolvedEmailRequest;
import com.roomiegram.usuario.DTO.SupportContactRequest;
import com.roomiegram.usuario.DTO.VisitAlternativeEmailRequest;
import com.roomiegram.usuario.DTO.VisitAlternativeResolvedEmailRequest;
import com.roomiegram.usuario.DTO.VisitRequestedEmailRequest;
import com.roomiegram.usuario.DTO.VisitResolvedEmailRequest;
import com.roomiegram.usuario.model.Register;
import com.roomiegram.usuario.repository.RegisterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationEmailService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationEmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private RegisterRepository registerRepository;

    @Value("${app.mail.from:no-reply@roomiegram.com}")
    private String mailFrom;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public boolean enviarCorreoTareaAsignada(TaskAssignmentEmailRequest request) {
        validarSolicitudTarea(request);

        Register encargado = registerRepository.findById(request.usuarioId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario encargado no encontrado"));

        String correoDestino = encargado.getCorreo();
        if (correoDestino == null || correoDestino.isBlank()) {
            throw new IllegalArgumentException("El usuario encargado no tiene correo registrado");
        }

        String nombreEncargado = valueOrDefault(encargado.getNombre(), encargado.getUsuario());
        String hogarNombre = valueOrDefault(request.hogarNombre(), "tu hogar");
        String asignadorNombre = valueOrDefault(request.asignadorNombre(), "Un integrante");

        return enviarCorreo(
                correoDestino,
                "Nueva tarea asignada en Roomiegram",
                "Hola " + nombreEncargado + ",\n\n"
                        + asignadorNombre + " te asigno una nueva tarea en " + hogarNombre + ".\n\n"
                        + "Tarea: " + request.titulo().trim() + "\n"
                        + "Descripcion: " + request.descripcion().trim() + "\n"
                        + "Fecha limite: " + request.fecha().trim() + "\n\n"
                        + "Entra a Roomiegram para revisar los detalles y marcarla cuando este lista.\n"
                        + frontendLinkLine() + "\n\n"
                        + "Equipo Roomiegram",
                "tarea asignada",
                request.usuarioId());
    }

    public boolean enviarCorreoSolicitudRecibida(RequestReceivedEmailRequest request) {
        validarSolicitudRecibida(request);

        Register receptor = registerRepository.findById(request.usuarioReceptorId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario receptor no encontrado"));

        String correoDestino = receptor.getCorreo();
        if (correoDestino == null || correoDestino.isBlank()) {
            throw new IllegalArgumentException("El usuario receptor no tiene correo registrado");
        }

        String nombreReceptor = valueOrDefault(receptor.getNombre(), receptor.getUsuario());
        String solicitanteNombre = valueOrDefault(request.solicitanteNombre(), "Un usuario");
        String hogarNombre = valueOrDefault(request.hogarNombre(), "tu hogar");
        String publicacionTitulo = valueOrDefault(request.publicacionTitulo(), "");
        String referencia = publicacionTitulo.isBlank()
                ? "Hogar relacionado: " + hogarNombre + "\n"
                : "Publicacion relacionada: " + publicacionTitulo + "\nHogar relacionado: " + hogarNombre + "\n";

        return enviarCorreo(
                correoDestino,
                "Nueva solicitud en Roomiegram",
                "Hola " + nombreReceptor + ",\n\n"
                        + solicitanteNombre + " envio una solicitud para unirse a tu grupo en Roomiegram.\n\n"
                        + referencia
                        + "\nEntra a Roomiegram para revisar, aprobar o rechazar la solicitud.\n"
                        + frontendLinkLine() + "\n\n"
                        + "Equipo Roomiegram",
                "solicitud recibida",
                request.usuarioReceptorId());
    }

    public boolean enviarCorreoSolicitudResuelta(RequestResolvedEmailRequest request) {
        validarSolicitudResuelta(request);

        Register solicitante = registerRepository.findById(request.usuarioSolicitanteId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario solicitante no encontrado"));

        String correoDestino = solicitante.getCorreo();
        if (correoDestino == null || correoDestino.isBlank()) {
            throw new IllegalArgumentException("El usuario solicitante no tiene correo registrado");
        }

        String nombreSolicitante = valueOrDefault(solicitante.getNombre(), solicitante.getUsuario());
        String hogarNombre = valueOrDefault(request.hogarNombre(), "el hogar solicitado");
        String administradorNombre = registerRepository.findById(request.administradorId())
                .map(admin -> valueOrDefault(admin.getNombre(), admin.getUsuario()))
                .orElse("El administrador");
        String estado = request.aceptada() ? "aceptada" : "rechazada";
        String accion = request.aceptada()
                ? "Ya puedes entrar a Roomiegram para revisar tu nuevo grupo."
                : "Puedes seguir buscando otros hogares disponibles en Roomiegram.";

        return enviarCorreo(
                correoDestino,
                "Tu solicitud fue " + estado + " en Roomiegram",
                "Hola " + nombreSolicitante + ",\n\n"
                        + administradorNombre + " ha " + estado + " tu solicitud para unirte a " + hogarNombre + ".\n\n"
                        + accion + "\n"
                        + frontendLinkLine() + "\n\n"
                        + "Equipo Roomiegram",
                "solicitud " + estado,
                request.usuarioSolicitanteId());
    }

    public boolean enviarCorreoTareaCompletada(TaskCompletedEmailRequest request) {
        validarSolicitudTareaCompletada(request);

        Register receptor = registerRepository.findById(request.usuarioReceptorId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario receptor no encontrado"));

        String correoDestino = receptor.getCorreo();
        if (correoDestino == null || correoDestino.isBlank()) {
            throw new IllegalArgumentException("El usuario receptor no tiene correo registrado");
        }

        String nombreReceptor = valueOrDefault(receptor.getNombre(), receptor.getUsuario());
        String hogarNombre = valueOrDefault(request.hogarNombre(), "tu hogar");
        String completadorNombre = registerRepository.findById(request.usuarioCompletadorId())
                .map(usuario -> valueOrDefault(usuario.getNombre(), usuario.getUsuario()))
                .orElse("Un integrante");

        return enviarCorreo(
                correoDestino,
                "Tarea completada en Roomiegram",
                "Hola " + nombreReceptor + ",\n\n"
                        + completadorNombre + " completó la tarea \"" + request.titulo().trim()
                        + "\" en el hogar " + hogarNombre + ".\n\n"
                        + "Descripción: " + valueOrDefault(request.descripcion(), "Sin descripción") + "\n"
                        + "Fecha límite: " + request.fecha().trim() + "\n\n"
                        + "Entra a Roomiegram para revisar el estado de las tareas del hogar.\n"
                        + frontendLinkLine() + "\n\n"
                        + "Equipo Roomiegram",
                "tarea completada",
                request.usuarioReceptorId());
    }

    public boolean enviarCorreoVisitaSolicitada(VisitRequestedEmailRequest request) {
        validarVisitaSolicitada(request);

        Register receptor = registerRepository.findById(request.usuarioReceptorId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario receptor no encontrado"));

        String correoDestino = receptor.getCorreo();
        if (correoDestino == null || correoDestino.isBlank()) {
            throw new IllegalArgumentException("El usuario receptor no tiene correo registrado");
        }

        String nombreReceptor = valueOrDefault(receptor.getNombre(), receptor.getUsuario());
        String interesadoNombre = valueOrDefault(request.interesadoNombre(), "Un usuario");
        String publicacionTitulo = valueOrDefault(request.publicacionTitulo(), "tu publicacion");
        String fechaHora = valueOrDefault(request.fechaHora(), "horario propuesto");
        String mensaje = valueOrDefault(request.mensaje(), "Sin mensaje adicional");

        return enviarCorreo(
                correoDestino,
                "Nueva solicitud de visita en Roomiegram",
                "Hola " + nombreReceptor + ",\n\n"
                        + interesadoNombre + " quiere coordinar una visita para " + publicacionTitulo + ".\n\n"
                        + "Horario propuesto: " + fechaHora + "\n"
                        + "Mensaje: " + mensaje + "\n\n"
                        + "Entra a Roomiegram para revisar su perfil, aceptar, rechazar o proponer otro horario.\n"
                        + frontendLinkLine() + "\n\n"
                        + "Equipo Roomiegram",
                "visita solicitada",
                request.usuarioReceptorId());
    }

    public boolean enviarCorreoVisitaResuelta(VisitResolvedEmailRequest request) {
        validarVisitaResuelta(request);

        Register interesado = registerRepository.findById(request.usuarioInteresadoId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario interesado no encontrado"));

        String correoDestino = interesado.getCorreo();
        if (correoDestino == null || correoDestino.isBlank()) {
            throw new IllegalArgumentException("El usuario interesado no tiene correo registrado");
        }

        String nombreInteresado = valueOrDefault(interesado.getNombre(), interesado.getUsuario());
        String anfitrionNombre = registerRepository.findById(request.anfitrionId())
                .map(usuario -> valueOrDefault(usuario.getNombre(), usuario.getUsuario()))
                .orElse("El anfitrion");
        String publicacionTitulo = valueOrDefault(request.publicacionTitulo(), "la publicacion");
        String estado = request.aceptada() ? "aceptada" : "rechazada";
        String accion = request.aceptada()
                ? "Ya puedes revisar los detalles de la visita y avanzar con la solicitud de ingreso si corresponde."
                : "Puedes seguir buscando otros hogares disponibles en Roomiegram.";

        return enviarCorreo(
                correoDestino,
                "Tu visita fue " + estado + " en Roomiegram",
                "Hola " + nombreInteresado + ",\n\n"
                        + anfitrionNombre + " ha " + estado + " tu solicitud de visita para " + publicacionTitulo + ".\n\n"
                        + "Horario: " + valueOrDefault(request.fechaHora(), "sin horario informado") + "\n\n"
                        + accion + "\n"
                        + frontendLinkLine() + "\n\n"
                        + "Equipo Roomiegram",
                "visita " + estado,
                request.usuarioInteresadoId());
    }

    public boolean enviarCorreoVisitaAlternativa(VisitAlternativeEmailRequest request) {
        validarVisitaAlternativa(request);

        Register interesado = registerRepository.findById(request.usuarioInteresadoId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario interesado no encontrado"));

        String correoDestino = interesado.getCorreo();
        if (correoDestino == null || correoDestino.isBlank()) {
            throw new IllegalArgumentException("El usuario interesado no tiene correo registrado");
        }

        String nombreInteresado = valueOrDefault(interesado.getNombre(), interesado.getUsuario());
        String anfitrionNombre = registerRepository.findById(request.anfitrionId())
                .map(usuario -> valueOrDefault(usuario.getNombre(), usuario.getUsuario()))
                .orElse("El anfitrion");
        String publicacionTitulo = valueOrDefault(request.publicacionTitulo(), "la publicacion");

        return enviarCorreo(
                correoDestino,
                "Nuevo horario propuesto para tu visita",
                "Hola " + nombreInteresado + ",\n\n"
                        + anfitrionNombre + " propuso otro horario para la visita de " + publicacionTitulo + ".\n\n"
                        + "Nuevo horario: " + valueOrDefault(request.fechaHoraAlternativa(), "sin horario informado") + "\n"
                        + "Mensaje: " + valueOrDefault(request.mensaje(), "Sin mensaje adicional") + "\n\n"
                        + "Entra a Roomiegram para aceptar o rechazar la propuesta.\n"
                        + frontendLinkLine() + "\n\n"
                        + "Equipo Roomiegram",
                "horario alternativo de visita",
                request.usuarioInteresadoId());
    }

    public boolean enviarCorreoVisitaAlternativaResuelta(VisitAlternativeResolvedEmailRequest request) {
        validarVisitaAlternativaResuelta(request);

        Register anfitrion = registerRepository.findById(request.usuarioAnfitrionId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario anfitrion no encontrado"));

        String correoDestino = anfitrion.getCorreo();
        if (correoDestino == null || correoDestino.isBlank()) {
            throw new IllegalArgumentException("El usuario anfitrion no tiene correo registrado");
        }

        String nombreAnfitrion = valueOrDefault(anfitrion.getNombre(), anfitrion.getUsuario());
        String interesadoNombre = registerRepository.findById(request.interesadoId())
                .map(usuario -> valueOrDefault(usuario.getNombre(), usuario.getUsuario()))
                .orElse("El interesado");
        String publicacionTitulo = valueOrDefault(request.publicacionTitulo(), "la publicacion");
        String estado = request.aceptada() ? "acepto" : "rechazo";

        return enviarCorreo(
                correoDestino,
                "Respuesta al horario alternativo de visita",
                "Hola " + nombreAnfitrion + ",\n\n"
                        + interesadoNombre + " " + estado + " el horario alternativo para visitar " + publicacionTitulo + ".\n\n"
                        + "Horario: " + valueOrDefault(request.fechaHora(), "sin horario informado") + "\n\n"
                        + "Entra a Roomiegram para revisar el estado de la visita.\n"
                        + frontendLinkLine() + "\n\n"
                        + "Equipo Roomiegram",
                "respuesta a horario alternativo",
                request.usuarioAnfitrionId());
    }

    public boolean enviarCorreoBienvenida(Register usuario) {
        if (usuario == null || usuario.getCorreo() == null || usuario.getCorreo().isBlank()) {
            return false;
        }

        String nombre = valueOrDefault(usuario.getNombre(), usuario.getUsuario());

        return enviarCorreo(
                usuario.getCorreo(),
                "Bienvenido a Roomiegram",
                "Hola " + nombre + ",\n\n"
                        + "Tu cuenta en Roomiegram fue creada correctamente.\n"
                        + "Ya puedes iniciar sesion, crear publicaciones, unirte a un hogar y organizar tareas con tus roomies.\n"
                        + frontendLinkLine() + "\n\n"
                        + "Equipo Roomiegram",
                "bienvenida",
                usuario.getId());
    }

    public boolean enviarContactoSoporte(SupportContactRequest request) {
        validarContactoSoporte(request);

        String nombre = valueOrDefault(request.nombre(), "Usuario Roomiegram");
        String usuario = valueOrDefault(request.usuario(), "No informado");
        String correo = request.correo().trim();
        String asunto = request.asunto().trim();
        String mensaje = request.mensaje().trim();

        return enviarCorreo(
                mailFrom,
                "Soporte Roomiegram: " + asunto,
                "Nuevo mensaje de soporte desde Roomiegram.\n\n"
                        + "Nombre: " + nombre + "\n"
                        + "Usuario: " + usuario + "\n"
                        + "Correo: " + correo + "\n\n"
                        + "Asunto: " + asunto + "\n\n"
                        + "Mensaje:\n" + mensaje + "\n\n"
                        + frontendLinkLine(),
                "contacto soporte",
                0L);
    }

    private boolean enviarCorreo(String destino, String asunto, String cuerpo, String contexto, Long usuarioId) {
        if (mailSender == null) {
            logger.warn("No se envio correo de {} al usuario {} porque SMTP no esta configurado.", contexto, usuarioId);
            return false;
        }

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(mailFrom);
            mailMessage.setTo(destino);
            mailMessage.setSubject(asunto);
            mailMessage.setText(cuerpo);

            mailSender.send(mailMessage);
            logger.info("Correo de {} enviado al usuario {}.", contexto, usuarioId);
            return true;
        } catch (RuntimeException e) {
            logger.warn("No se pudo enviar correo de {} al usuario {}: {}", contexto, usuarioId, e.getMessage());
            return false;
        }
    }

    private void validarSolicitudTarea(TaskAssignmentEmailRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de correo es obligatoria");
        }
        if (request.usuarioId() == null) {
            throw new IllegalArgumentException("El usuario encargado es obligatorio");
        }
        if (request.titulo() == null || request.titulo().isBlank()) {
            throw new IllegalArgumentException("El titulo de la tarea es obligatorio");
        }
        if (request.descripcion() == null || request.descripcion().isBlank()) {
            throw new IllegalArgumentException("La descripcion de la tarea es obligatoria");
        }
        if (request.fecha() == null || request.fecha().isBlank()) {
            throw new IllegalArgumentException("La fecha limite de la tarea es obligatoria");
        }
    }

    private void validarSolicitudRecibida(RequestReceivedEmailRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de correo es obligatoria");
        }
        if (request.usuarioReceptorId() == null) {
            throw new IllegalArgumentException("El usuario receptor es obligatorio");
        }
        if (request.usuarioSolicitanteId() == null) {
            throw new IllegalArgumentException("El usuario solicitante es obligatorio");
        }
    }

    private void validarSolicitudResuelta(RequestResolvedEmailRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de correo es obligatoria");
        }
        if (request.usuarioSolicitanteId() == null) {
            throw new IllegalArgumentException("El usuario solicitante es obligatorio");
        }
        if (request.administradorId() == null) {
            throw new IllegalArgumentException("El administrador es obligatorio");
        }
    }

    private void validarSolicitudTareaCompletada(TaskCompletedEmailRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de correo es obligatoria");
        }
        if (request.usuarioReceptorId() == null) {
            throw new IllegalArgumentException("El usuario receptor es obligatorio");
        }
        if (request.usuarioCompletadorId() == null) {
            throw new IllegalArgumentException("El usuario que completo la tarea es obligatorio");
        }
        if (request.titulo() == null || request.titulo().isBlank()) {
            throw new IllegalArgumentException("El titulo de la tarea es obligatorio");
        }
        if (request.fecha() == null || request.fecha().isBlank()) {
            throw new IllegalArgumentException("La fecha limite de la tarea es obligatoria");
        }
    }

    private void validarContactoSoporte(SupportContactRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("El mensaje de soporte es obligatorio");
        }
        if (request.asunto() == null || request.asunto().trim().isBlank()) {
            throw new IllegalArgumentException("El asunto es obligatorio");
        }
        if (request.asunto().trim().length() > 100) {
            throw new IllegalArgumentException("El asunto no puede superar 100 caracteres");
        }
        if (request.mensaje() == null || request.mensaje().trim().isBlank()) {
            throw new IllegalArgumentException("El mensaje es obligatorio");
        }
        int largoMensaje = request.mensaje().trim().length();
        if (largoMensaje < 20) {
            throw new IllegalArgumentException("El mensaje debe tener al menos 20 caracteres");
        }
        if (largoMensaje > 1000) {
            throw new IllegalArgumentException("El mensaje no puede superar 1000 caracteres");
        }
        if (request.correo() == null || request.correo().trim().isBlank()) {
            throw new IllegalArgumentException("El correo de contacto es obligatorio");
        }
        if (!request.correo().contains("@")) {
            throw new IllegalArgumentException("Ingresa un correo de contacto valido");
        }
    }

    private void validarVisitaSolicitada(VisitRequestedEmailRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de correo es obligatoria");
        }
        if (request.usuarioReceptorId() == null) {
            throw new IllegalArgumentException("El anfitrion receptor es obligatorio");
        }
        if (request.usuarioInteresadoId() == null) {
            throw new IllegalArgumentException("El usuario interesado es obligatorio");
        }
    }

    private void validarVisitaResuelta(VisitResolvedEmailRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de correo es obligatoria");
        }
        if (request.usuarioInteresadoId() == null) {
            throw new IllegalArgumentException("El usuario interesado es obligatorio");
        }
        if (request.anfitrionId() == null) {
            throw new IllegalArgumentException("El anfitrion es obligatorio");
        }
    }

    private void validarVisitaAlternativa(VisitAlternativeEmailRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de correo es obligatoria");
        }
        if (request.usuarioInteresadoId() == null) {
            throw new IllegalArgumentException("El usuario interesado es obligatorio");
        }
        if (request.anfitrionId() == null) {
            throw new IllegalArgumentException("El anfitrion es obligatorio");
        }
    }

    private void validarVisitaAlternativaResuelta(VisitAlternativeResolvedEmailRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La solicitud de correo es obligatoria");
        }
        if (request.usuarioAnfitrionId() == null) {
            throw new IllegalArgumentException("El anfitrion receptor es obligatorio");
        }
        if (request.interesadoId() == null) {
            throw new IllegalArgumentException("El usuario interesado es obligatorio");
        }
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String frontendLinkLine() {
        return "Entrar a Roomiegram: " + valueOrDefault(frontendUrl, "http://localhost:5173");
    }
}
