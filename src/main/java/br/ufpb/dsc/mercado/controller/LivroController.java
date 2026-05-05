package br.ufpb.dsc.mercado.controller;

import br.ufpb.dsc.mercado.domain.Livro;
import br.ufpb.dsc.mercado.dto.LivroForm;
import br.ufpb.dsc.mercado.exception.LivroNaoEncontradoException;
import br.ufpb.dsc.mercado.service.LivroService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelo CRUD de livros.
 *
 * <p><strong>Padrão HTMX + Thymeleaf:</strong><br>
 * HTMX permite fazer requisições AJAX sem escrever JavaScript, substituindo apenas
 * fragmentos específicos do DOM em vez de recarregar a página inteira.
 * O padrão utilizado neste controller é:
 * <ul>
 *   <li>Requisição normal (navegador) → retorna a página HTML completa</li>
 *   <li>Requisição HTMX (header {@code HX-Request: true}) → retorna apenas o fragmento necessário</li>
 * </ul>
 *
 * <p><strong>Fragmentos Thymeleaf:</strong><br>
 * Um fragmento é uma parte de um template HTML identificada por {@code th:fragment="nome"}.
 * Para retornar um fragmento, use a notação: {@code "caminho/arquivo :: nomeDoFragmento"}
 *
 * <p><strong>{@code @Controller} vs {@code @RestController}:</strong><br>
 * {@code @Controller} retorna nomes de views (templates Thymeleaf).
 * {@code @RestController} retorna dados serializados (JSON/XML) diretamente.
 * Como estamos usando templates, usamos {@code @Controller}.
 *
 * @author DSC - UFPB Campus IV
 */
@Controller
@RequestMapping("/livros")
public class LivroController {

    private static final int TAMANHO_PAGINA = 10;

    // Header enviado pelo HTMX em toda requisição feita pela biblioteca
    private static final String HEADER_HTMX = "HX-Request";

    private final LivroService livroService;

    public LivroController(LivroService livroService) {
        this.livroService = livroService;
    }

    // =========================================================================
    // LISTAGEM
    // =========================================================================

    /**
     * Exibe a página principal com a lista de livros.
     *
     * <p>Verifica o header {@code HX-Request} para decidir se retorna a página
     * completa (primeira carga) ou apenas o fragmento da tabela (atualização via HTMX).
     *
     * @param busca   texto de busca opcional (vindo do campo de pesquisa)
     * @param pagina  número da página (começa em 0)
     * @param htmx    header HTMX — presente quando a requisição vem do HTMX
     * @param model   modelo do Thymeleaf com dados para o template
     * @return nome do template ou fragmento a ser renderizado
     */
    @GetMapping
    public String listar(
            @RequestParam(name = "busca", required = false, defaultValue = "") String busca,
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestHeader(value = HEADER_HTMX, required = false) String htmx,
            Model model) {

        // Cria configuração de paginação: página atual, tamanho e ordenação por título
        PageRequest pageRequest = PageRequest.of(pagina, TAMANHO_PAGINA, Sort.by("titulo").ascending());
        Page<Livro> livros = livroService.buscar(busca, pageRequest);

        model.addAttribute("livros", livros);
        model.addAttribute("busca", busca);
        model.addAttribute("paginaAtual", pagina);

        // Se for requisição HTMX, retorna apenas o fragmento da tabela (mais eficiente)
        // O HTMX substitui apenas o elemento alvo, sem recarregar toda a página
        if (htmx != null) {
            return "livros/fragments/tabela :: tabela";
        }

        // Requisição normal do navegador → página completa
        return "livros/lista";
    }

    /**
     * Endpoint dedicado para o HTMX atualizar apenas o fragmento da tabela.
     * Útil para o campo de busca com {@code hx-trigger="keyup changed delay:400ms"}.
     *
     * @param busca  texto de busca
     * @param pagina número da página
     * @param model  modelo Thymeleaf
     * @return fragmento da tabela
     */
    @GetMapping("/fragmento-tabela")
    public String fragmentoTabela(
            @RequestParam(name = "busca", required = false, defaultValue = "") String busca,
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            Model model) {

        PageRequest pageRequest = PageRequest.of(pagina, TAMANHO_PAGINA, Sort.by("titulo").ascending());
        Page<Livro> livros = livroService.buscar(busca, pageRequest);

        model.addAttribute("livros", livros);
        model.addAttribute("busca", busca);
        model.addAttribute("paginaAtual", pagina);

        // Sempre retorna apenas o fragmento (este endpoint é exclusivo do HTMX)
        return "livros/fragments/tabela :: tabela";
    }

    // =========================================================================
    // FORMULÁRIO (NOVO / EDITAR)
    // =========================================================================

    /**
     * Retorna o fragmento do formulário para criar um novo livro.
     *
     * <p>Chamado pelo HTMX quando o usuário clica em "Novo Livro":
     * <pre>
     *   hx-get="/livros/novo" hx-target="#modal-container"
     * </pre>
     *
     * @param model modelo Thymeleaf
     * @return fragmento do formulário vazio
     */
    @GetMapping("/novo")
    public String novoForm(Model model) {
        // Passa um form vazio para o Thymeleaf vincular com th:object
        model.addAttribute("form", new LivroForm(null, null, null, null, null));
        model.addAttribute("livro", null); // sem livro = modo criação
        return "livros/fragments/form :: modal";
    }

    /**
     * Retorna o fragmento do formulário preenchido com os dados do livro para edição.
     *
     * <p>Chamado pelo HTMX quando o usuário clica em "Editar":
     * <pre>
     *   hx-get="/livros/{id}/editar" hx-target="#modal-container"
     * </pre>
     *
     * @param id    ID do livro a editar
     * @param model modelo Thymeleaf
     * @return fragmento do formulário preenchido
     */
    @GetMapping("/{id}/editar")
    public String editarForm(@PathVariable Long id, Model model) {
        Livro livro = livroService.buscarPorId(id);
        // Converte entidade para form (preenche os campos do formulário)
        LivroForm form = new LivroForm(
                livro.getTitulo(),
                livro.getAutor(),
                livro.getDescricao(),
                livro.getPreco(),
                livro.getAnoPublicacao()
        );
        model.addAttribute("form", form);
        model.addAttribute("livro", livro); // com livro = modo edição
        return "livros/fragments/form :: modal";
    }

    // =========================================================================
    // CRIAÇÃO
    // =========================================================================

    /**
     * Processa o formulário de criação de livro via HTMX.
     *
     * <p>{@code @Valid} ativa a validação Bean Validation no objeto {@code form}.
     * {@code BindingResult} captura os erros de validação (deve vir imediatamente após o objeto validado).
     *
     * <p>Fluxo HTMX esperado no formulário:
     * <pre>
     *   hx-post="/livros"
     *   hx-target="#lista-livros"
     *   hx-swap="beforeend"
     * </pre>
     * Isso adiciona a nova linha ao final da tabela sem recarregar.
     *
     * @param form          dados do formulário (validados automaticamente pelo Spring)
     * @param bindingResult resultado da validação
     * @param model         modelo Thymeleaf
     * @return fragmento da nova linha da tabela ou fragmento do form com erros
     */
    @PostMapping
    public String criar(
            @Valid @ModelAttribute("form") LivroForm form,
            BindingResult bindingResult,
            Model model) {

        // Se houver erros de validação, retorna o formulário com as mensagens de erro
        if (bindingResult.hasErrors()) {
            model.addAttribute("livro", null);
            return "livros/fragments/form :: modal";
        }

        Livro novoLivro = livroService.criar(form);
        model.addAttribute("livro", novoLivro);

        // Retorna apenas a linha da tabela para ser inserida via HTMX (hx-swap="beforeend")
        return "livros/fragments/linha :: linha";
    }

    // =========================================================================
    // ATUALIZAÇÃO
    // =========================================================================

    /**
     * Processa o formulário de edição de livro via HTMX.
     *
     * <p>Fluxo HTMX esperado:
     * <pre>
     *   hx-put="/livros/{id}"
     *   hx-target="#livro-{id}"
     *   hx-swap="outerHTML"
     * </pre>
     * Isso substitui a linha existente pela linha atualizada.
     *
     * @param id            ID do livro a atualizar
     * @param form          dados do formulário
     * @param bindingResult resultado da validação
     * @param model         modelo Thymeleaf
     * @return fragmento da linha atualizada ou fragmento do form com erros
     */
    @PutMapping("/{id}")
    public String atualizar(
            @PathVariable Long id,
            @Valid @ModelAttribute("form") LivroForm form,
            BindingResult bindingResult,
            Model model) {

        if (bindingResult.hasErrors()) {
            // Recarrega o livro para o formulário saber que está em modo edição
            Livro livro = livroService.buscarPorId(id);
            model.addAttribute("livro", livro);
            return "livros/fragments/form :: modal";
        }

        Livro livroAtualizado = livroService.atualizar(id, form);
        model.addAttribute("livro", livroAtualizado);

        // Retorna a linha atualizada para substituir a linha antiga (hx-swap="outerHTML")
        return "livros/fragments/linha :: linha";
    }

    // =========================================================================
    // EXCLUSÃO
    // =========================================================================

    /**
     * Exclui um livro via HTMX.
     *
     * <p>O HTMX com {@code hx-swap="outerHTML"} e um body vazio remove o elemento do DOM.
     * Fluxo esperado no template:
     * <pre>
     *   hx-delete="/livros/{id}"
     *   hx-target="#livro-{id}"
     *   hx-swap="outerHTML"
     *   hx-confirm="Confirma exclusão?"
     * </pre>
     *
     * <p>Retornamos {@code ResponseEntity} aqui porque precisamos controlar o status HTTP
     * e retornar um body vazio (para o HTMX remover o elemento do DOM).
     *
     * @param id ID do livro a excluir
     * @return 200 OK com body vazio (HTMX remove o elemento) ou 404 se não encontrado
     */
    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        try {
            livroService.excluir(id);
            // 200 OK com body vazio → HTMX substitui o elemento por nada (remove da tela)
            return ResponseEntity.ok().build();
        } catch (LivroNaoEncontradoException e) {
            return ResponseEntity.notFound().build();
        }
    }
}