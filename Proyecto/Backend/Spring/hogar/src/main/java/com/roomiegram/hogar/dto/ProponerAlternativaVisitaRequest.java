package com.roomiegram.hogar.dto;

import java.time.LocalDateTime;

public record ProponerAlternativaVisitaRequest(
        Long anfitrionId,
        LocalDateTime fechaHoraAlternativa,
        String mensaje) {
}
