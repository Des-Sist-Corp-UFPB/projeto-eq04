package br.ufpb.dsc.mercado.service;

import br.ufpb.dsc.mercado.domain.Livro;
import br.ufpb.dsc.mercado.dto.LivroForm;
import br.ufpb.dsc.mercado.exception.LivroNaoEncontradoException;
import br.ufpb.dsc.mercado.repository.LivroRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LivroService — Testes Unitários")
class ProdutoServiceTest {

    @Mock
    private LivroRepository livroRepository;

    @InjectMocks
    private LivroService livroService;

    private Livro livroExistente;
    private LivroForm formValido;

    @BeforeEach
    void setUp() {
        livroExistente = new Livro("Clean Code", "Robert C. Martin",
                "Guia de código limpo.", new BigDecimal("99.90"), 2008);
        // Simula ID gerado pelo banco via reflexão
        try {
            var field = Livro.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(livroExistente, 1L);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        formValido = new LivroForm("Effective Java", "Joshua Bloch",
                "Boas práticas em Java.", new BigDecimal("120.00"), 2018);
    }

    // =========================================================================
    // buscarPorId
    // =========================================================================

    @Test
    @DisplayName("buscarPorId: deve retornar livro quando ID existe")
    void buscarPorId_quandoIdExiste_deveRetornarLivro() {
        when(livroRepository.findById(1L)).thenReturn(Optional.of(livroExistente));

        Livro resultado = livroService.buscarPorId(1L);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getId()).isEqualTo(1L);
        assertThat(resultado.getTitulo()).isEqualTo("Clean Code");

        verify(livroRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("buscarPorId: deve lançar exceção quando ID não existe")
    void buscarPorId_quandoIdNaoExiste_deveLancarExcecao() {
        when(livroRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> livroService.buscarPorId(99L))
                .isInstanceOf(LivroNaoEncontradoException.class)
                .hasMessageContaining("99");

        verify(livroRepository, times(1)).findById(99L);
    }

    // =========================================================================
    // criar
    // =========================================================================

    @Test
    @DisplayName("criar: deve salvar e retornar o novo livro")
    void criar_comFormValido_deveSalvarERetornarLivro() {
        Livro livroSalvo = new Livro(formValido.titulo(), formValido.autor(),
                formValido.descricao(), formValido.preco(), formValido.anoPublicacao());
        try {
            var field = Livro.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(livroSalvo, 2L);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        when(livroRepository.save(any(Livro.class))).thenReturn(livroSalvo);

        Livro resultado = livroService.criar(formValido);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getId()).isEqualTo(2L);
        assertThat(resultado.getTitulo()).isEqualTo("Effective Java");
        assertThat(resultado.getPreco()).isEqualByComparingTo("120.00");

        verify(livroRepository, times(1)).save(any(Livro.class));
    }

    // =========================================================================
    // atualizar
    // =========================================================================

    @Test
    @DisplayName("atualizar: deve modificar os dados do livro existente")
    void atualizar_quandoLivroExiste_deveAtualizarDados() {
        when(livroRepository.findById(1L)).thenReturn(Optional.of(livroExistente));
        when(livroRepository.save(any(Livro.class))).thenReturn(livroExistente);

        LivroForm formAtualizado = new LivroForm("Refactoring", "Martin Fowler",
                "Técnicas de refatoração.", new BigDecimal("130.75"), 1999);

        Livro resultado = livroService.atualizar(1L, formAtualizado);

        assertThat(resultado.getTitulo()).isEqualTo("Refactoring");
        assertThat(resultado.getPreco()).isEqualByComparingTo("130.75");

        verify(livroRepository).findById(1L);
        verify(livroRepository).save(any(Livro.class));
    }

    @Test
    @DisplayName("atualizar: deve lançar exceção quando livro não existe")
    void atualizar_quandoLivroNaoExiste_deveLancarExcecao() {
        when(livroRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> livroService.atualizar(99L, formValido))
                .isInstanceOf(LivroNaoEncontradoException.class);

        verify(livroRepository, never()).save(any());
    }

    // =========================================================================
    // excluir
    // =========================================================================

    @Test
    @DisplayName("excluir: deve deletar livro quando ID existe")
    void excluir_quandoLivroExiste_deveDeletar() {
        when(livroRepository.existsById(1L)).thenReturn(true);
        doNothing().when(livroRepository).deleteById(1L);

        assertThatCode(() -> livroService.excluir(1L))
                .doesNotThrowAnyException();

        verify(livroRepository).existsById(1L);
        verify(livroRepository).deleteById(1L);
    }

    @Test
    @DisplayName("excluir: deve lançar exceção quando livro não existe")
    void excluir_quandoLivroNaoExiste_deveLancarExcecao() {
        when(livroRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> livroService.excluir(99L))
                .isInstanceOf(LivroNaoEncontradoException.class)
                .hasMessageContaining("99");

        verify(livroRepository, never()).deleteById(any());
    }
}
