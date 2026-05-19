package br.ufpb.dsc.mercado.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record LivroForm(

        @NotBlank(message = "O título é obrigatório")
        @Size(min = 2, max = 120, message = "O título deve ter entre 2 e 120 caracteres")
        String titulo,

        @NotBlank(message = "O autor é obrigatório")
        @Size(min = 2, max = 150, message = "O autor deve ter entre 2 e 150 caracteres")
        String autor,

        @Size(max = 2000, message = "A descrição pode ter no máximo 2000 caracteres")
        String descricao,

        @NotNull(message = "O preço é obrigatório")
        @DecimalMin(value = "0.00", message = "O preço não pode ser negativo")
        @Digits(integer = 8, fraction = 2, message = "Preço deve ter no máximo 8 dígitos inteiros e 2 decimais")
        BigDecimal preco,

        @Min(value = 1000, message = "Ano de publicação inválido")
        @Max(value = 9999, message = "Ano de publicação inválido")
        Integer anoPublicacao
) {}
