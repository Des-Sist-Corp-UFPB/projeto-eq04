package br.ufpb.dsc.mercado.controller;

import br.ufpb.dsc.mercado.domain.Livro;
import br.ufpb.dsc.mercado.repository.LivroRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
@DisplayName("LivroController — Testes de Integração")
class ProdutoControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LivroRepository livroRepository;

    private Livro livroCadastrado;

    @BeforeEach
    void setUp() {
        livroRepository.deleteAll();

        livroCadastrado = livroRepository.save(
                new Livro("Clean Code", "Robert C. Martin", "Guia de código limpo.",
                        new BigDecimal("99.90"), 2008)
        );
    }

    // =========================================================================
    // GET /produtos
    // =========================================================================

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("GET /produtos: deve retornar página de listagem com status 200")
    void listar_usuarioAutenticado_deveRetornarPaginaLista() throws Exception {
        mockMvc.perform(get("/produtos"))
                .andExpect(status().isOk())
                .andExpect(view().name("produtos/lista"))
                .andExpect(model().attributeExists("livros"))
                .andExpect(content().string(containsString("Clean Code")));
    }

    @Test
    @DisplayName("GET /produtos: usuário não autenticado deve ser redirecionado para /login")
    void listar_semAutenticacao_deveRedirecionarParaLogin() throws Exception {
        mockMvc.perform(get("/produtos"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrlPattern("**/login"));
    }

    // =========================================================================
    // GET /produtos/novo
    // =========================================================================

    @Test
    @WithMockUser
    @DisplayName("GET /produtos/novo: deve retornar fragmento do formulário vazio")
    void novoForm_deveRetornarFragmentoFormulario() throws Exception {
        mockMvc.perform(get("/produtos/novo"))
                .andExpect(status().isOk())
                .andExpect(view().name("produtos/fragments/form :: modal"))
                .andExpect(model().attributeExists("form"))
                .andExpect(model().attribute("livro", nullValue()));
    }

    // =========================================================================
    // POST /produtos
    // =========================================================================

    @Test
    @WithMockUser
    @DisplayName("POST /produtos: deve criar livro e retornar fragmento da linha")
    void criar_dadosValidos_deveCriarERetornarLinha() throws Exception {
        mockMvc.perform(post("/produtos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("titulo", "Effective Java")
                        .param("autor", "Joshua Bloch")
                        .param("descricao", "Boas práticas em Java")
                        .param("preco", "120.00")
                        .param("anoPublicacao", "2018"))
                .andExpect(status().isOk())
                .andExpect(view().name("produtos/fragments/linha :: linha"))
                .andExpect(model().attributeExists("livro"))
                .andExpect(content().string(containsString("Effective Java")));
    }

    @Test
    @WithMockUser
    @DisplayName("POST /produtos: dados inválidos devem retornar formulário com erros")
    void criar_dadosInvalidos_deveRetornarFormularioComErros() throws Exception {
        mockMvc.perform(post("/produtos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("titulo", "")        // título vazio — inválido
                        .param("autor", "")         // autor vazio — inválido
                        .param("preco", "-1.00"))   // preço negativo — inválido
                .andExpect(status().isOk())
                .andExpect(view().name("produtos/fragments/form :: modal"))
                .andExpect(model().hasErrors());
    }

    // =========================================================================
    // GET /produtos/{id}/editar
    // =========================================================================

    @Test
    @WithMockUser
    @DisplayName("GET /produtos/{id}/editar: deve retornar formulário preenchido")
    void editarForm_livroExistente_deveRetornarFormularioPreenchido() throws Exception {
        mockMvc.perform(get("/produtos/{id}/editar", livroCadastrado.getId()))
                .andExpect(status().isOk())
                .andExpect(view().name("produtos/fragments/form :: modal"))
                .andExpect(model().attributeExists("form", "livro"))
                .andExpect(content().string(containsString("Clean Code")));
    }

    // =========================================================================
    // DELETE /produtos/{id}
    // =========================================================================

    @Test
    @WithMockUser
    @DisplayName("DELETE /produtos/{id}: deve excluir livro e retornar 200")
    void excluir_livroExistente_deveRetornar200() throws Exception {
        mockMvc.perform(delete("/produtos/{id}", livroCadastrado.getId())
                        .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    @DisplayName("DELETE /produtos/{id}: livro inexistente deve retornar 404")
    void excluir_livroInexistente_deveRetornar404() throws Exception {
        mockMvc.perform(delete("/produtos/{id}", 9999L)
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }
}
